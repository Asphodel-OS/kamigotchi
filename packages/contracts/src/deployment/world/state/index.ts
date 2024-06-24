import { AdminAPI } from '../admin';

import { initAuth, initLocalAuth } from './auth';
import { initConfigs, initLocalConfigs } from './configs';
import { initGachaPool } from './gacha';
import { initGoals } from './goals';
import { initItems } from './items';
import { initNodes } from './nodes';
import { initNpcs } from './npcs';
import { initLocalQuests, initQuests } from './quests';
import { initRelationships } from './relationships';
import { initRooms } from './rooms';
import { initSkills } from './skills';
import { initTraits } from './traits';

export async function initAll(api: AdminAPI, local: boolean) {
  await initAuth(api);
  await initConfigs(api);
  await initRooms(api);
  await initNodes(api);
  await initItems(api);
  await initNpcs(api);
  await initQuests(api);
  await initSkills(api);
  await initTraits(api);
  await initRelationships(api);
  await initGoals(api);

  if (local) {
    await initAllLocal(api);
  }
}

export async function initAllLocal(api: AdminAPI) {
  await initLocalAuth(api);
  await initLocalConfigs(api);
  await initGachaPool(api, 50);
  await initLocalQuests(api);
}

export { initAuth } from './auth';
export { initConfigs, initLocalConfigs } from './configs';
export { initGachaPool } from './gacha';
export { deleteGoals, initGoals } from './goals';
export { deleteItems, initItems, reviseItems } from './items';
export { deleteNodes, initNodes, reviseNodes } from './nodes';
export { initNpcs } from './npcs';
export { deleteQuests, initLocalQuests, initQuests, reviseQuests } from './quests';
export { deleteRelationships, initRelationships } from './relationships';
export { deleteRooms, initGates, initRooms, reviseRooms } from './rooms';
export { deleteSkills, initSkills, reviseSkills } from './skills';
export { initTraits } from './traits';
