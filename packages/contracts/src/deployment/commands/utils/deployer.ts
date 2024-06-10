import { constants } from 'ethers';
import { generateLibDeploy } from './codegen';
import { findLog } from './findLog';
import { ignoreSolcErrors } from './utils';
import execa = require('execa');

const contractsDir = __dirname + '/../../contracts/';

/**
 * Deploy world, components and systems from deploy.json
 * @param deployerPriv private key of deployer
 * @param rpc rpc url
 * @param worldAddress optional, address of existing world
 * @param reuseComponents optional, reuse existing components
 * @returns address of deployed world
 */
export async function deploy(
  deployerPriv?: string,
  rpc = 'http://localhost:8545',
  reuseComponents?: boolean,
  worldAddress?: string,
  forgeOpts?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/Deploy.s.sol:Deploy',
      '--broadcast',
      '--sig',
      'deploy(uint256,address,bool)',
      deployerPriv || constants.AddressZero, // Deployer
      worldAddress || constants.AddressZero, // World address (0 = deploy a new world)
      (reuseComponents || false).toString(), // Reuse components
      '--fork-url',
      rpc,
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forgeOpts?.split(' ') || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  // Extract world address from deploy script
  const lines = (await child).stdout?.split('\n');
  const deployedWorldAddress = findLog(lines, 'world: contract IWorld');
  const startBlock = findLog(lines, 'startBlock: uint256');

  console.log('---------------------------------------------\n');
  console.log('Deployed world at:', deployedWorldAddress);
  console.log('Start block:', startBlock);
  console.log('\n---------------------------------------------');
  console.log('\n\n');

  return { child: await child, deployedWorldAddress, startBlock };
}

export type DeployOptions = {
  config: string;
  rpc: string;
  deployerPriv: string;
  worldAddress?: string;
  components?: string;
  systems?: string;
  forgeOpts?: string;
};

export async function generateAndDeploy(args: DeployOptions) {
  let libDeployPath: string | undefined;
  let deployedWorldAddress: string | undefined;
  let startBlock: string | undefined;

  try {
    // Generate LibDeploy
    libDeployPath = await generateLibDeploy(
      args.config,
      contractsDir,
      args.components,
      args.systems
    );

    // Call deploy script
    const result = await deploy(
      args.deployerPriv,
      args.rpc,
      args.systems != undefined,
      args.worldAddress,
      args.forgeOpts
    );
    deployedWorldAddress = result.deployedWorldAddress;
    startBlock = result.startBlock;
  } catch (e) {
    console.error(e);
  }

  return { deployedWorldAddress, startBlock };
}
