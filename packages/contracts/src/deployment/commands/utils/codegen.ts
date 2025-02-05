import ejs from 'ejs';
import { readFile, rm, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { deferred } from './deferred';
import { extractIdFromFile, keccak256 } from './ids';
import { parseCompTypeDef } from './utils';

const deploymentDir = path.join(__dirname, '../../');
const contractsDir = path.join(deploymentDir, 'contracts/');
const baseContractsDir = path.join(deploymentDir, '../../');
const clientDir = path.join(deploymentDir, '../../../client/');
const deployConfigPath = path.join('./deploy.json');

const componentRegisterPath = path.join(clientDir, 'src/network/components/register.ts');
const componentSchemaPath = path.join(clientDir, 'types/ComponentsSchema.ts');

export async function generateImports(out: string) {
  const config = JSON.parse(await readFile(deployConfigPath, { encoding: 'utf8' }));
  // component & system import script
  const Imports = await ejs.renderFile(path.join(contractsDir, 'Imports.ejs'), config, {
    async: true,
  });
  const ImportsPath = path.join(out, 'Imports.sol');
  await writeFile(ImportsPath, Imports);
}

export async function generateIDs() {
  const config = JSON.parse(await readFile(deployConfigPath, { encoding: 'utf8' }));

  const components: any[] = config.components;
  components.map((comp) => {
    const id = extractIdFromFile(
      path.join(baseContractsDir, 'src/components', comp.comp + 'Component.sol')
    );
    comp.id = id;
    comp.encodedID = keccak256(id || '');
  });

  const compIDs =
    '{ \n' +
    components
      .map(
        (comp) =>
          `  "${comp.name}": {
    "id": "${comp.id}",
    "encodedID": "${comp.encodedID}"
  },`
      )
      .join('\n') +
    '\n}';
  await writeFile(path.join(baseContractsDir, 'componentIDs.json'), compIDs);

  const systems: any[] = config.systems;
  systems.map((sys) => {
    const id = extractIdFromFile(path.join(baseContractsDir, 'src/systems', sys.name + '.sol'));
    sys.id = id;
    sys.encodedID = keccak256(id || '');
  });
  const sysIDs =
    '{ \n' +
    systems
      .map(
        (sys) =>
          `  "${sys.name}": {
    "id": "${sys.id}",
   "encodedID": "${sys.encodedID}"
  },`
      )
      .join('\n') +
    '\n}';
  await writeFile(path.join(baseContractsDir, 'systemIDs.json'), sysIDs);
}

/**
 * Generate LibDeploy.sol from deploy.json
 * @param configPath path to deploy.json
 * @param out output directory for LibDeploy.sol
 * @param systems optional, only generate deploy code for the given systems
 * @returns path to generated LibDeploy.sol
 */
export async function generateLibDeploy(
  configPath: string,
  out: string,
  components?: string,
  systems?: string
) {
  // Parse config
  const config = JSON.parse(await readFile(configPath, { encoding: 'utf8' }));

  if (components && systems)
    console.error(
      'cannot update both components and systems at the same time, please update one at a time.'
    );

  // Filter components
  if (components) {
    const componentsArray = components.split(',').map((comp: string) => comp.trim());
    config.components = config.components.filter((component: any) =>
      componentsArray.includes(component.comp)
    );
    config.systems = [];
  }
  // Filter systems
  if (systems) {
    const systemsArray = systems.split(',').map((sys: string) => sys.trim());
    config.systems = config.systems.filter((system: { name: string }) =>
      systemsArray.includes(system.name)
    );
  }

  console.log(`Deploy config: \n`, JSON.stringify(config, null, 2));
  await generateImports(out);
  // Generate LibDeploy
  console.log('Generating deployment script');
  // LibDeploy.sol
  const LibDeploy = await ejs.renderFile(path.join(contractsDir, 'LibDeploy.ejs'), config, {
    async: true,
  });
  const libDeployPath = path.join(out, 'LibDeploy.sol');
  await writeFile(libDeployPath, LibDeploy);

  return libDeployPath;
}

export async function generateInitWorld() {
  const callsPath = path.join(contractsDir, 'initStream.json');
  const systemCalls = JSON.parse(await readFile(callsPath, { encoding: 'utf8' }));

  const InitWorld = await ejs.renderFile(path.join(contractsDir, 'InitWorld.s.ejs'), systemCalls, {
    async: true,
  });
  const initWorldPath = path.join(contractsDir, 'InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}

export async function clearInitWorld() {
  // const initWorldPath = path.join(contractsDir, 'InitWorld.s.sol');
  // await rm(initWorldPath, { force: true });
  const InitWorld = await ejs.renderFile(
    path.join(contractsDir, 'InitWorld.s.ejs'),
    { calls: [] },
    {
      async: true,
    }
  );
  const initWorldPath = path.join(contractsDir, 'InitWorld.s.sol');
  await writeFile(initWorldPath, InitWorld);
}

export async function generateSystemTypes(
  inputDir: string,
  outputDir: string,
  options?: { clear?: boolean }
) {
  if (options?.clear) {
    console.log('Clearing system type output files', outputDir);
    await rm(path.join(outputDir, '/SystemTypes.ts'), { force: true });
    // await rm(path.join(outputDir, "/SystemAbis.mts"), { force: true });
    await rm(path.join(outputDir, '/SystemAbis.mjs'), { force: true });
    await rm(path.join(outputDir, '/SystemMappings.ts'), { force: true });
  }

  let abis: string[] = [];
  let systems: string[] = [];
  let ids: string[] = [];
  let typePaths: string[] = [];

  const systemsPath = `${inputDir}/*.sol`;

  const [resolve, , promise] = deferred<void>();
  glob(systemsPath, {}, (_: any, matches: string[]) => {
    systems = matches.map((path) => {
      const fragments = path.split('/');
      return fragments[fragments.length - 1].split('.sol')[0];
    });

    ids = matches.map((path, index) => {
      const id = extractIdFromFile(path);
      if (!id) {
        // console.log("Path:", path);
        // console.log("ID:", id);
        throw new Error(
          'No ID found for' +
            matches[index] +
            '. Make sure your system source file includes a ID definition (uint256 constant ID = uint256(keccak256(<ID>));)'
        );
      }
      return id;
    });

    abis = systems.map((system) => `../abi/${system}.json`);

    typePaths = systems.map((system) => `./ethers-contracts/${system}.ts`);

    resolve();
  });

  // Make the callback synchronous
  await promise;

  const SystemMappings = `// Autogenerated using mud system-types
export const systemToId = {
${systems.map((system, index) => `  ${system}: "${ids[index]}",`).join('\n')}
};

export const idToSystem = {
${ids.map((id, index) => `  "${id}": "${systems[index]}",`).join('\n')}
};
  `;

  const SystemTypes = `// Autogenerated using mud system-types
${typePaths
  .map((path, index) => `import { ${systems[index]} } from "${path.replace('.ts', '')}";`)
  .join('\n')}

export type SystemTypes = {
${systems.map((system, index) => `  "${ids[index]}": ${system};`).join('\n')}
};
`;

  const SystemAbis = `// Autogenerated using mud system-types
${abis.map((path, index) => `import ${systems[index]} from "${path}";`).join('\n')}

export const SystemAbis = {
${systems.map((system, index) => `  "${ids[index]}": ${system}.abi,`).join('\n')}
};
`;

  await writeFile(`${outputDir}/SystemTypes.ts`, SystemTypes);
  // await writeFile(`${outputDir}/SystemAbis.mts`, SystemAbis);
  await writeFile(`${outputDir}/SystemAbis.mjs`, SystemAbis);
  await writeFile(`${outputDir}/SystemMappings.ts`, SystemMappings);
}

/**
 * Generate Component register.ts and component schemas in client
 */
export async function generateComponentSchemas(options?: { clear?: boolean }) {
  if (options?.clear) {
    console.log('Clearing component register output files', componentRegisterPath);
    await rm(path.join(componentRegisterPath), { force: true });
    console.log('Clearing component schema output files', componentSchemaPath);
    await rm(path.join(componentSchemaPath), { force: true });
  }

  const components: any[] = JSON.parse(
    await readFile(deployConfigPath, { encoding: 'utf8' })
  ).components;
  // adding ids
  components.map((comp) => {
    const id = extractIdFromFile(
      path.join(baseContractsDir, 'src/components', comp.comp + 'Component.sol')
    );
    comp.id = id;
    comp.encodedID = keccak256(id || '');
  });

  const ComponentsRegistry = `// Autogenerated using mud component-types
import { World } from '@mud-classic/recs';
import {
  defineBoolComponent,
  defineLoadingStateComponent,
  defineNumberArrayComponent,
  defineNumberComponent,
  defineStatComponent,
  defineStringComponent,
  defineTimelockComponent,
} from './definitions';

export type Components = ReturnType<typeof createComponents>;

// define functions for registration
export function createComponents(world: World) {
  return {
${components
  .map(
    (comp) =>
      `    ${comp.name}: ${parseCompTypeDef(comp.type, comp.FEtype)}(world, '${comp.name}', '${comp.id}'${comp.indexed ? ', true' : ''}),`
  )
  .join('\n')}

  // world components
  Components: defineStringComponent(world, 'Components', 'world.component.components'),
  Systems: defineStringComponent(world, 'Systems', 'world.component.systems'),

  // local components
  LoadingState: defineLoadingStateComponent(world),
  }
}`;

  // adding schemas to components[]
  const schemaMap = JSON.parse(
    await readFile(path.join(baseContractsDir, 'src/solecs/components/types/schema.json'), {
      encoding: 'utf8',
    })
  );
  components.map((comp) => {
    comp.schema = schemaMap[comp.type];
    if (comp.schema === undefined)
      throw new Error(`No schema found for ${comp.comp} (looking for ${comp.type})`);
  });

  const ComponentSchema = `// Autogenerated using mud component-types
export const ComponentsSchema = {
${components
  .map((comp) => {
    return `  '${comp.encodedID}': { keys: [${comp.schema.keys}], values: [${comp.schema.values}] },`;
  })
  .join('\n')}
};
`;

  console.log('writing component registry');
  await writeFile(componentRegisterPath, ComponentsRegistry);
  console.log('writing component schema');
  await writeFile(componentSchemaPath, ComponentSchema);
}

/**
 * Generate SystemAbis.ts & SystemMappings.ts from client system config
 * Copies over mud autogen system abis into a here
 * needed to bypass esm/cjs/node stuff
 */
export async function generateAbiMappings() {
  // copying ABIs
  const outPath = path.join(deploymentDir, 'world/mappings/SystemAbis.ts');
  const original = await readFile(path.join(clientDir, 'types/SystemAbis.mjs'), {
    encoding: 'utf8',
  });
  const result = original.replace(/..\/abi/g, '../../../../../client/abi');
  await writeFile(outPath, result);

  // copying mappings
  const outPathMapping = path.join(deploymentDir, 'world/mappings/SystemMappings.ts');
  const mappings = await readFile(path.join(clientDir, 'types/SystemMappings.ts'), {
    encoding: 'utf8',
  });
  await writeFile(outPathMapping, mappings);

  return;
}
