import ejs from 'ejs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { DeployConfig, getDeployComponents, getDeploySystems } from '../../utils';
import { generateImports } from './imports';
import { deploymentDir } from './paths';

/**
 * Generate LibDeploy.sol from deploy.json
 * @param configPath path to deploy.json
 * @param out output directory for LibDeploy.sol
 * @param systems optional, only generate deploy code for the given systems
 * @returns path to generated LibDeploy.sol
 */
export async function generateLibDeploy(out: string, components?: string, systems?: string) {
  if (components && systems)
    console.error(
      'cannot update both components and systems at the same time, please update one at a time.'
    );

  let config: any;
  if (components) {
    config = getDeployComponents(components);
  } else if (systems) {
    config = getDeploySystems(systems);
  } else {
    config = DeployConfig; // full
  }

  console.log(`Deploy config: \n`, JSON.stringify(config, null, 2));
  await generateImports(out);
  // Generate LibDeploy
  console.log('Generating deployment script');
  // LibDeploy.sol
  const LibDeploy = await ejs.renderFile(
    path.join(deploymentDir, 'contracts/LibDeploy.ejs'),
    config,
    {
      async: true,
    }
  );
  const libDeployPath = path.join(out, 'LibDeploy.sol');
  await writeFile(libDeployPath, LibDeploy);

  return libDeployPath;
}
