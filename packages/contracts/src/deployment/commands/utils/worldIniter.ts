import { constants } from 'ethers';
import { WorldState } from '../../world/world';
import { generateInitWorld } from './codegen';
import execa = require('execa');

import { SubFunc, WorldAPI } from '../../world/world';

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

export async function generateInitScript(
  mode: string,
  categories: Array<keyof WorldAPI>,
  action: keyof SubFunc,
  args?: number[]
) {
  const local = mode === 'DEV';

  const world = new WorldState();
  if (categories.length === 0) {
    // init global
    await world.api.init(local);
  } else {
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (category === 'init') throw new Error(`Cannot double init globally`);
      const func = world.api[category] as SubFunc; // init special case filtered out
      if (!func) throw new Error(`No such category ${category}`);

      if (action === 'init') {
        await func.init();
      } else {
        const call = func[action];
        if (!call) throw new Error(`No such action ${action} on world.${category}`);
        if (!args) throw new Error(`No args provided for ${category}.${action}`);
        await call(args);
      }
    }
  }

  // generate system calls
  await world.writeCalls();
  await generateInitWorld();
}
