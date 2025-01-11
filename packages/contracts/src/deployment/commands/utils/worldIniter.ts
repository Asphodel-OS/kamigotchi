import { constants } from 'ethers';
import { WorldState } from '../../world/world';
import { generateInitWorld } from './codegen';
import execa = require('execa');

import { AdminAPI } from '../../world/admin';
import { SystemAbis } from '../../world/mappings/SystemAbis';
import { SubFunc, WorldAPI } from '../../world/world';
import { ignoreSolcErrors } from './utils';

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
      ...ignoreSolcErrors,
      ...(forgeOpts?.toString().split(/,| /) || []),
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

/// @dev generates a single call piggybacking off initWorld.s.sol
export async function generateSingleCall(
  mode: string,
  systemID: string,
  func: string,
  args: any[]
) {
  const world = new WorldState();
  const toCall = async (api: AdminAPI) => {
    const system = systemID as keyof typeof SystemAbis;
    if (!system) throw new Error(`No such system ${systemID}`);
    await api.gen(system, args, func);
  };

  await world.genCalls(toCall);
  await world.writeCalls();
  await generateInitWorld();
}

export async function generateInitScript(
  mode: string,
  category: keyof WorldAPI,
  action: keyof SubFunc | keyof WorldAPI['admin'],
  args?: number[]
) {
  const local = mode === 'DEV';
  const world = new WorldState();

  if (category === 'init') await world.api.init(local);
  else if (category === 'admin') {
    // special case for admin actions
    const call = world.api.admin[action as keyof WorldAPI['admin']];
    if (!call) throw new Error(`No such action ${action} on world.admin`);
    await call(args || [0]);
  } else {
    const func = world.api[category] as SubFunc; // init special case filtered out
    if (!func) throw new Error(`No such category ${category}`);

    const call = func[action as keyof SubFunc];
    if (!call) throw new Error(`No such action ${action} on world.${category}`);
    // if (!args) throw new Error(`No args provided for ${category}.${action}`);
    await call(args);
  }

  console.log(`** Generated init script **`);
  // generate system calls
  await world.writeCalls();
  await generateInitWorld();
}
