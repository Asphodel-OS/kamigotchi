import { AdminAPI } from '../../api';
import { getGoalID } from '../utils';

// hardcoded gates - placeholder until notion is up
const gates = {
  // 1: (api: AdminAPI) => api.room.createGate(1, 1, 0, 0, 'CURR_MIN', 'KAMI', ''), // load bearing test to initialse IndexSourceComponent - queries wont work without
  15: (api: AdminAPI) => api.room.createGate(15, 0, 35, 0, 'QUEST', 'BOOL_IS', 'ACCOUNT'),
  19: (api: AdminAPI) =>
    api.room.createGate(19, 0, 0, getGoalID(8), 'COMPLETE_COMP', 'BOOL_IS', ''),
  31: (api: AdminAPI) =>
    api.room.createGate(31, 0, 0, getGoalID(1), 'COMPLETE_COMP', 'BOOL_IS', ''),
  50: (api: AdminAPI) =>
    api.room.createGate(50, 0, 0, getGoalID(3), 'COMPLETE_COMP', 'BOOL_IS', ''),
  53: (api: AdminAPI) =>
    api.room.createGate(53, 0, 0, getGoalID(4), 'COMPLETE_COMP', 'BOOL_IS', ''),
  58: (api: AdminAPI) =>
    api.room.createGate(58, 0, 0, getGoalID(9), 'COMPLETE_COMP', 'BOOL_IS', ''),
  68: (api: AdminAPI) =>
    api.room.createGate(68, 0, 0, getGoalID(5), 'COMPLETE_COMP', 'BOOL_IS', ''),
  78: (api: AdminAPI) =>
    api.room.createGate(78, 0, 0, getGoalID(6), 'COMPLETE_COMP', 'BOOL_IS', ''),
  84: (api: AdminAPI) =>
    api.room.createGate(84, 0, 0, getGoalID(6), 'COMPLETE_COMP', 'BOOL_IS', ''),
  86: (api: AdminAPI) =>
    api.room.createGate(86, 0, 0, getGoalID(7), 'COMPLETE_COMP', 'BOOL_IS', ''),
};

export async function createGates(api: AdminAPI, roomIndex: number) {
  // create gate if there is a gate at index
  // uses placeholder gates above
  if (roomIndex in gates) {
    try {
      console.log(`  creating gates for room ${roomIndex}`);
      await gates[roomIndex as keyof typeof gates](api);
    } catch (e) {
      console.log('gate creation failure:', e);
    }
  }
}
