import { initConfigs } from './state/configs';
import { initGachaPool } from './state/gacha';
import { deleteGoals, initGoals } from './state/goals';
import { deleteItems, initItems } from './state/items';
import { deleteNodes, initNodes } from './state/nodes';
import { initNpcs } from './state/npcs';
import { deleteQuests, initQuests, initQuestsByIndex } from './state/quests';
import { deleteRelationships, initRelationships } from './state/relationships';
import { deleteRooms, initRoom, initRooms } from './state/rooms';
import { deleteSkills, initSkills } from './state/skills';
import { deleteTraits, initTraits } from './state/traits';

import { AdminAPI, createAdminAPI } from './admin';

/**
 * This is adapted off world.ts from the client package.
 */

export function createWorldAPI() {
  async function genCalls(func: (api: AdminAPI) => Promise<void>) {
    const compiledCalls: string[] = [];
    const state = createAdminAPI(compiledCalls);
    await func(state);
    writeOutput(compiledCalls);
  }

  async function initAll(api: AdminAPI) {
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

    await initGachaPool(api, 50);
  }

  return {
    init: () => genCalls(initAll),
    config: {
      init: () => genCalls(initConfigs),
    },
    goals: {
      init: () => genCalls(initGoals),
      delete: (indices: number[]) => genCalls((api) => deleteGoals(api, indices)),
    },
    items: {
      init: () => genCalls(initItems),
      delete: (indices: number[]) => genCalls((api) => deleteItems(api, indices)),
    },
    npcs: {
      init: () => genCalls(initNpcs),
    },
    nodes: {
      init: () => genCalls(initNodes),
      delete: (indices: number[]) => genCalls((api) => deleteNodes(api, indices)),
    },
    mint: {
      init: (n: number) => genCalls((api) => initGachaPool(api, n)),
    },
    quests: {
      init: () => genCalls(initQuests),
      initByIndex: (indices: number[]) => genCalls((api) => initQuestsByIndex(api, indices)),
      delete: (indices: number[]) => genCalls((api) => deleteQuests(api, indices)),
    },
    relationships: {
      init: () => genCalls(initRelationships),
      delete: (npcs: number[], indices: number[]) =>
        genCalls((api) => deleteRelationships(api, indices, npcs)),
    },
    rooms: {
      init: () => genCalls(initRooms),
      initByIndex: (i: number) => genCalls((api) => initRoom(api, i)),
      delete: (indices: number[]) => genCalls((api) => deleteRooms(api, indices)),
    },
    skill: {
      init: (indices?: number[]) => genCalls((api) => initSkills(api, indices)),
      delete: (indices: number[]) => genCalls((api) => deleteSkills(api, indices)),
    },
    traits: {
      init: () => genCalls(initTraits),
      delete: (indices: number[], types: string[]) =>
        genCalls((api) => deleteTraits(api, indices, types)),
    },
  };
}

function writeOutput(data: string[]) {
  // let result = `{\n"calls":\n` + JSON.stringify(data, null, 2) + '\n}';
  let result = `{\n  "calls": [\n` + data.join(',\n') + '\n  ]\n}';
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, '../contracts/', 'initStream.json'), result, {
    encoding: 'utf8',
  });
}
