import { constants } from 'ethers';
import { ignoreSolcErrors } from '../utils';
import { findLog } from '../utils/findLog';
import { deploymentDir } from '../utils/paths';
import { generateLibDeploy } from './codegen';
import execa = require('execa');

export async function deploy(
  reuseComponents?: boolean,
  worldAddress?: string,
  emitter?: boolean,
  forge?: string,
  initWorld?: boolean
) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deploy.s.sol:Deploy',
      '--broadcast',
      '--sig',
      'deploy(uint256,address,bool,bool,bool,address,bool)',
      process.env.PRIV_KEY!, // deployer
      worldAddress || constants.AddressZero, // World address (0 = deploy a new world)
      (reuseComponents || false).toString(), // Reuse components
      (initWorld || false).toString(), // Init world
      (emitter || false).toString(), // Deploy emitter
      (process.env.MULTISIG || constants.AddressZero).toString(), // Multisig address
      (process.env.NODE_ENV === 'puter').toString(), // Local mode
      '--fork-url',
      process.env.RPC!,
      '--with-gas-price',
      '0',
      '--skip',
      'test',
      '--gas-limit',
      '10000000000',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));
  // Extract world address from deploy script
  const lines = (await child).stdout?.split('\n');
  const deployedWorldAddress = findLog(lines, 'world: contract World');
  const startBlock = findLog(lines, 'startBlock: uint256');

  console.log('---------------------------------------------\n');
  console.log('Deployed world at:', deployedWorldAddress);
  console.log('Start block:', startBlock);
  console.log('\n---------------------------------------------');
  console.log('\n\n');

  return { child: await child, deployedWorldAddress, startBlock };
}

export type DeployOptions = {
  worldAddress?: string;
  components?: string;
  systems?: string;
  emitter?: boolean;
  initWorld?: boolean;
  forge?: string;
  reuseComponents?: boolean;
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
      reuseComps,
      args.worldAddress,
      args.emitter,
      args.forge,
      args.initWorld
    );
    deployedWorldAddress = result.deployedWorldAddress;
    startBlock = result.startBlock;
  } catch (e) {
    console.error(e);
  }

  return { deployedWorldAddress, startBlock };
}
