import { AdminAPI } from '../api';
import { initAuctions } from './auctions';

import { initAuth, initLocalAuth } from './auth';
import { initConfigs, initLocalConfigs, initProdConfigs, initTestingConfigs } from './configs';
import { initFactions } from './factions';
import { initGachaPool } from './gacha';
import { initGoals } from './goals';
import { initItems, initLocalItems } from './items';
import { initListings } from './listings';
import { initNpcs } from './npcs';
import { initQuests } from './quests/quests';
import { initRecipes } from './recipes';
import { initRelationships } from './relationships';
import { initNodes, initRooms } from './rooms';
import { initSkills } from './skills';
import { initSnapshot } from './snapshot';
import { initTraits } from './traits';

export async function initAll(api: AdminAPI) {
  // independent
  await initAuth(api);
  if (process.env.NODE_ENV === 'puter') await initLocalAuth(api); // needs to be declared prior
  console.log('\n---------------------------------------------\n');
  await initConfigs(api);
  console.log('\n---------------------------------------------\n');
  await initFactions(api);
  console.log('\n---------------------------------------------\n');
  await initItems(api, [], true);
  console.log('\n---------------------------------------------\n');
  await initNpcs(api);
  console.log('\n---------------------------------------------\n');
  await initRooms(api, undefined, true);
  console.log('\n---------------------------------------------\n');
  await initSkills(api);
  console.log('\n---------------------------------------------\n');
  await initTraits(api);
  console.log('\n---------------------------------------------\n');

  // dependent
  await initAuctions(api);
  console.log('\n---------------------------------------------\n');
  await initListings(api, undefined, true);
  console.log('\n---------------------------------------------\n');
  await initNodes(api);
  console.log('\n---------------------------------------------\n');
  await initGoals(api);
  console.log('\n---------------------------------------------\n');
  await initQuests(api, undefined, true);
  console.log('\n---------------------------------------------\n');
  await initRecipes(api, [], true);
  console.log('\n---------------------------------------------\n');
  await initRelationships(api);
  console.log('\n---------------------------------------------\n');

  await initSnapshot(api);

  if (process.env.NODE_ENV === 'puter') {
    console.log('generating local inits');
    await initGachaPool(api, 88);
    console.log('\n---------------------------------------------\n');
    await initAllLocal(api);
  } else if (process.env.NODE_ENV === 'testing') {
    await initAllTesting(api);
    await initGachaPool(api, 2222);
  } else if (process.env.NODE_ENV === 'production') {
    await initAllProd(api);
    await initGachaPool(api, 2222);
  } else {
    await initGachaPool(api, 2222);
  }
}

export async function initAllLocal(api: AdminAPI) {
  await initLocalAuth(api);
  await initLocalConfigs(api);
  await initLocalItems(api);
  await api.setup.local.initAccounts();
  await api.setup.local.initPets();
  await api.setup.local.initHarvests();
}

export async function initAllTesting(api: AdminAPI) {
  await initTestingConfigs(api);
  // await initTestingWorldWL(api);
}

export async function initAllProd(api: AdminAPI) {
  await initProdConfigs(api);
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
export { deleteQuests, initQuests, reviseQuests } from './quests';
export { deleteRecipes, initRecipes, reviseRecipes } from './recipes';
export { deleteRelationships, initRelationships } from './relationships';
export { deleteNodes, initNodes, reviseNodes } from './rooms/nodes';
export { deleteRooms, initRooms, reviseRooms } from './rooms/rooms';
export { deleteSkills, initSkills, reviseSkills } from './skills';
export { initTraits } from './traits';
