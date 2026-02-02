import { execWorldState } from '../scripts/worldIniter';
import { initNPCDroptables } from '../world/state';

// Initialize NPC sacrifice droptables
// Usage: pnpm run world:state -s initNPCDroptables
execWorldState(async (api) => {
  console.log('Initializing NPC droptables...');
  await initNPCDroptables(api);
  console.log('Done.');
});
