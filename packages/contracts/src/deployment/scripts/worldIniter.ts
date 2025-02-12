import { WorldState } from '../world/world';
import { generateInitWorld } from './codegen';

import { SystemBytecodes } from '../contracts/mappings/SystemBytecodes';
import { AdminAPI } from '../world/api';
import { SubFunc, WorldAPI } from '../world/world';

/// @dev generates a single call piggybacking off initWorld.s.sol
export async function generateSingleCall(
  mode: string,
  systemID: string,
  func: string,
  args: any[]
) {
  const world = new WorldState();
  const toCall = async (api: AdminAPI) => {
    const system = systemID as keyof typeof SystemBytecodes;
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
