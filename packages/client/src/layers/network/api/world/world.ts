import { MUDJsonRpcProvider } from 'engine/executors/providers';
import { createAdminAPI } from '../admin';
import { createPlayerAPI } from '../player';
import { initConfigs, initLocalConfigs } from './configs';
import { initGachaPool } from './gacha';
import { deleteGoals, initGoals } from './goals';
import { deleteItems, initItems } from './items';
import { deleteNodes, initNodes } from './nodes';
import { initNpcs } from './npcs';
import { deleteQuests, initLocalQuests, initQuests, initQuestsByIndex } from './quests';
import { deleteRelationships, initRelationships } from './relationships';
import { deleteRooms, initRoom, initRooms } from './rooms';
import { deleteSkills, initSkills } from './skills';
import { deleteTraits, initTraits } from './traits';
import { setAutoMine, setTimestamp } from './utils';

export type WorldAPI = ReturnType<typeof setupWorldAPI>;

export function setupWorldAPI(systems: any, provider: MUDJsonRpcProvider) {
  const api = createAdminAPI(systems);

  async function initAll() {
    setAutoMine(provider, true);

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

    const mode = import.meta.env.MODE;
    if (!mode || mode === 'development') {
      await initLocalConfigs(api);
      await initGachaPool(api, 333);
      await initLocalQuests(api);
    } else {
      await initGachaPool(api, 333);
    }

    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer'
    );

    setTimestamp(provider);
    setAutoMine(provider, false);
  }

  return {
    init: initAll,
    config: {
      init: () => initConfigs(api),
    },
    goals: {
      init: () => initGoals(api),
      delete: (indices: number[]) => deleteGoals(api, indices),
    },
    items: {
      init: () => initItems(api),
      delete: (indices: number[]) => deleteItems(api, indices),
    },
    npcs: {
      init: () => initNpcs(api),
    },
    nodes: {
      init: () => initNodes(api),
      delete: (indices: number[]) => deleteNodes(api, indices),
    },
    mint: {
      init: (n: number) => initGachaPool(api, n),
    },
    quests: {
      init: () => initQuests(api),
      initByIndex: (indices: number[]) => initQuestsByIndex(api, indices),
      delete: (indices: number[]) => deleteQuests(api, indices),
    },
    relationships: {
      init: () => initRelationships(api),
      delete: (npcs: number[], indices: number[]) => deleteRelationships(api, indices, npcs),
    },
    rooms: {
      init: () => initRooms(api),
      initByIndex: (i: number) => initRoom(api, i),
      delete: (indices: number[]) => deleteRooms(api, indices),
    },
    skill: {
      init: (indices?: number[]) => initSkills(api, indices),
      delete: (indices: number[]) => deleteSkills(api, indices),
    },
    traits: {
      init: () => initTraits(api),
      delete: (indices: number[], types: string[]) => deleteTraits(api, indices, types),
    },
  };
}
