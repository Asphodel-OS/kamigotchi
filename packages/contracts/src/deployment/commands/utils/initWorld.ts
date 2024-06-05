import { constants } from 'ethers';
import { createWorldAPI } from '../../world/world';
import { generateInitWorld } from './codegen';
import execa = require('execa');

const contractsDir = __dirname + '/../../contracts/';

/**
 * Init world using world state, runs InitWorld.s.sol
 * @param deployerPriv private key of deployer
 * @param rpc rpc url
 * @param worldAddress optional, address of existing world
 * @param reuseComponents optional, reuse existing components
 * @returns address of deployed world
 */
export async function initWorld(
  deployerPriv?: string,
  rpc = 'http://localhost:8545',
  worldAddress?: string,
  forgeOpts?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/InitWorld.s.sol:InitWorld',
      '--broadcast',
      '--sig',
      'initWorld(uint256,address)',
      deployerPriv || constants.AddressZero, // Deployer
      worldAddress || constants.AddressZero, // World address (0 = deploy a new world)
      '--fork-url',
      rpc,
      '--skip',
      'test',
      ...(forgeOpts?.split(' ') || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  console.log('---------------------------------------------\n');
  console.log('World state initialing ');
  console.log('\n---------------------------------------------');
  console.log('\n\n');

  return { child: await child };
}

export async function generateInitScript() {
  // Generate system calls
  await createWorldAPI().init();

  // generate system calls
  await generateInitWorld();
}
