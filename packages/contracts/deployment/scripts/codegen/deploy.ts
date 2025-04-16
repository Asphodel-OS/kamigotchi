import ejs from 'ejs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { DeployConfig, getDeployComponents, getDeploySystems } from '../../utils';
import { deploymentDir } from '../../utils/paths';
import { generateImports } from './imports';

/**
 * Generate LibDeploy.sol from deploy.json
 * @param configPath path to deploy.json
 * @param out output directory for LibDeploy.sol
 * @param systems optional, only generate deploy code for the given systems
 * @returns path to generated LibDeploy.sol
 */
export async function generateLibDeploy(out: string, components?: string, systems?: string) {
  if (components && systems) console.error('cant update components and systems simultaneously');

  // getting config
  let config = getConfig(components, systems);
  config = filterConfigEnv(config); // filtering out skipped comps/systems specific to env

  // generating LibDeploy
  console.log(`Deploy config: \n`, JSON.stringify(config, null, 2));
  await generateImports(out);
  const LibDeploy = await ejs.renderFile(
    path.join(deploymentDir, 'contracts/LibDeploy.ejs'),
    config,
    { async: true }
  );
  const libDeployPath = path.join(out, 'LibDeploy.sol');
  await writeFile(libDeployPath, LibDeploy);

  return libDeployPath;
}

//////////////////
// UTILS

function getConfig(components?: string, systems?: string) {
  let config: any;
  if (components) {
    config = getDeployComponents(components);
  } else if (systems) {
    config = getDeploySystems(systems);
  } else {
    config = DeployConfig; // full
  }
  return config;
}

function filterConfigEnv(config: any) {
  for (let i = 0; i < config.components.length; i++) {
    const entry = config.components[i];
    if (entry.skipEnv && entry.skipEnv.includes(process.env.NODE_ENV!)) {
      config.components.splice(i, 1);
      i--;
    }
  }
  for (let i = 0; i < config.systems.length; i++) {
    const entry = config.systems[i];
    if (entry.skipEnv && entry.skipEnv.includes(process.env.NODE_ENV!)) {
      config.systems.splice(i, 1);
      i--;
    }
  }
  return config;
}
