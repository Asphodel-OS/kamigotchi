import { constants } from 'ethers';
import { ignoreSolcErrors } from '../utils';
import { findLog } from '../utils/findLog';
import { deploymentDir } from '../utils/paths';
import { generateLibDeploy } from './codegen';
import execa = require('execa');

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
  emitter?: boolean,
  forgeOpts?: string,
  initWorld?: boolean,
  mode?: string,
  multisig?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deploy.s.sol:Deploy',
      '--broadcast',
      '--sig',
      'deploy(uint256,address,bool,bool,bool,address,string)',
      deployerPriv || constants.AddressZero, // Deployer
      worldAddress || constants.AddressZero, // World address (0 = deploy a new world)
      (reuseComponents || false).toString(), // Reuse components
      (initWorld || false).toString(), // Init world
      (emitter || false).toString(), // Deploy emitter
      (multisig || constants.AddressZero).toString(), // Multisig address
      (mode || 'DEV').toString(), // Mode
      '--fork-url',
      rpc,
      '--skip',
      'test',
      '--gas-limit',
      '10000000000',
      ...ignoreSolcErrors,
      ...(forgeOpts?.toString().split(/,| /) || []),
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
  rpc: string;
  deployerPriv: string;
  worldAddress?: string;
  components?: string;
  systems?: string;
  emitter?: boolean;
  initWorld?: boolean;
  forgeOpts?: string;
  mode?: string;
  reuseComponents?: boolean;
  multisig?: string;
};

export async function generateAndDeploy(args: DeployOptions) {
  let deployedWorldAddress: string | undefined;
  let startBlock: string | undefined;

  // if reuseComp not specified, reuse if system upgrade
  const reuseComps =
    args.reuseComponents == undefined ? args.systems != undefined : args.reuseComponents;

  try {
    // Generate LibDeploy
    await generateLibDeploy(deploymentDir + 'contracts/', args.components, args.systems);

    // Call deploy script
    const result = await deploy(
      args.deployerPriv,
      args.rpc,
      reuseComps,
      args.worldAddress,
      args.emitter,
      args.forgeOpts,
      args.initWorld,
      args.mode,
      args.multisig
    );
    deployedWorldAddress = result.deployedWorldAddress;
    startBlock = result.startBlock;
  } catch (e) {
    console.error(e);
  }

  return { deployedWorldAddress, startBlock };
}
