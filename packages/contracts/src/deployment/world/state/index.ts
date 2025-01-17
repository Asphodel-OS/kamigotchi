import { AdminAPI } from '../api';

import { initAuth, initLocalAuth } from './auth';
import { initConfigs, initLocalConfigs } from './configs';
import { initFactions } from './factions';
import { initGachaPool } from './gacha';
import { initGoals } from './goals';
import { initItems } from './items';
import { initListings } from './listings';
import { initNodes } from './nodes';
import { initNpcs } from './npcs';
import { initLocalQuests, initQuests } from './quests';
import { initRecipes } from './recipes';
import { initRelationships } from './relationships';
import { initRooms } from './rooms';
import { initSkills } from './skills';
import { initTraits } from './traits';

export async function initAll(api: AdminAPI, local: boolean) {
  await initAuth(api);
  await initConfigs(api);
  await initFactions(api);
  await initRooms(api);
  await initNodes(api);
  await initItems(api);
  await initNpcs(api);
  await initListings(api);
  await initQuests(api);
  await initSkills(api);
  await initTraits(api);
  await initRecipes(api);
  await initRelationships(api);
  await initGoals(api);

  if (local) {
    await initAllLocal(api);
    await initGachaPool(api, 88);
  } else {
    await initGachaPool(api, 2500);
  }

  // await initSnapshot(api);
}

export async function initAllLocal(api: AdminAPI) {
  await initLocalAuth(api);
  await initLocalConfigs(api);
  await initLocalQuests(api);
}

export { initAuth } from './auth';
export { initConfigs, initLocalConfigs } from './configs';
export { deleteFactions, initFactions, reviseFactions } from './factions';
export { initGachaPool, mintToGachaPool } from './gacha';
export { deleteGoals, initGoals } from './goals';
export { deleteItems, initItems, reviseItems } from './items';
export { deleteListings, initListings, refreshListing } from './listings';
export { deleteNodes, initNodes, reviseNodes } from './nodes';
export { initNpcs } from './npcs';
export { deleteQuests, initLocalQuests, initQuests, reviseQuests } from './quests';
export { deleteRecipes, initRecipes, reviseRecipes } from './recipes';
export { deleteRelationships, initRelationships } from './relationships';
export { deleteRooms, initRooms, reviseRooms } from './rooms';
export { deleteSkills, initSkills, reviseSkills } from './skills';
export { initTraits } from './traits';
