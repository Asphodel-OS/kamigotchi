import { AdminAPI } from '../api';
import { initAuctions } from './auctions';

import { initAuth, initLocalAuth } from './auth';
import { initConfigs, initLocalConfigs } from './configs';
import { initFactions } from './factions';
import { initGachaPool } from './gacha';
import { initItems, initLocalItems } from './items';
import { initListings } from './listings';
import { initNpcs } from './npcs';
import { initLocalQuests } from './quests';
import { initRelationships } from './relationships';
import { initNodes, initRooms } from './rooms';
import { initSkills } from './skills';
import { initTraits } from './traits';

export async function initAll(api: AdminAPI, local: boolean) {
  // independent
  await initAuth(api);
  await initConfigs(api);
  await initFactions(api);
  await initItems(api, undefined, local);
  await initNpcs(api);
  await initRooms(api, undefined, local);
  await initSkills(api);
  await initTraits(api);

  // dependent
  await initAuctions(api);
  await initListings(api, undefined, local);
  await initNodes(api);
  // await initGoals(api);
  // await initQuests(api);
  // await initRecipes(api);
  await initRelationships(api);

  if (local) {
    await initGachaPool(api, 88);
    await initAllLocal(api);
  } else {
    await initGachaPool(api, 100);
  }

  // await initSnapshot(api);
}

export async function initAllLocal(api: AdminAPI) {
  await initLocalAuth(api);
  await initLocalConfigs(api);
  await initLocalQuests(api);
  await initLocalItems(api);
  await api.setup.initAccounts();
  await api.setup.initPets();
  await api.setup.initHarvests();
}

export { deleteAuctions, initAuctions, reviseAuctions } from './auctions';
export { initAuth } from './auth';
export {
  initConfigs,
  initHarvest as initHarvestConfigs,
  initLiquidation as initLiquidationConfigs,
  initLocalConfigs,
} from './configs';
export { deleteFactions, initFactions, reviseFactions } from './factions';
export { initGachaPool, mintToGachaPool } from './gacha';
export { deleteGoals, initGoals } from './goals';
export { deleteItems, initItems, reviseItems } from './items';
export { deleteListings, initListings, reviseListings } from './listings';
export { initNpcs } from './npcs';
export { deleteQuests, initLocalQuests, initQuests, reviseQuests } from './quests';
export { deleteRecipes, initRecipes, reviseRecipes } from './recipes';
export { deleteRelationships, initRelationships } from './relationships';
export { deleteNodes, initNodes, reviseNodes } from './rooms/nodes';
export { deleteRooms, initRooms, reviseRooms } from './rooms/rooms';
export { deleteSkills, initSkills, reviseSkills } from './skills';
export { initTraits } from './traits';
