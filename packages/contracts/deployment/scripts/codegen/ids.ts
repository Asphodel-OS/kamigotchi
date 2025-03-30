import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { extractIdFromFile, keccak256 } from '../../utils/ids';
import { contractsDir, deployConfigPath } from '../../utils/paths';

export async function generateIDs() {
  const config = JSON.parse(await readFile(deployConfigPath, { encoding: 'utf8' }));

  const components: any[] = config.components;
  components.map((comp) => {
    const id = extractIdFromFile(
      path.join(contractsDir, 'src/components', comp.comp + 'Component.sol')
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
  await writeFile(path.join(contractsDir, 'componentIDs.json'), compIDs);

  const systems: any[] = config.systems;
  systems.map((sys) => {
    const id = extractIdFromFile(path.join(contractsDir, 'src/systems', sys.name + '.sol'));
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
  await writeFile(path.join(contractsDir, 'systemIDs.json'), sysIDs);
}
