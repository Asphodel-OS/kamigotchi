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

/// @note not currently in use, but archived in the codebase to potentially be useful someday
/**
 * This is adapted off world.ts from the client package.
 *
 * Not implemented
 */

export async function run() {
  const compiledCalls: string[] = [];
  const state = createAdminAPI(compiledCalls);
  await setUpWorld(state).init();
  writeOutput(compiledCalls);
}

function setUpWorld(api: AdminAPI) {
  async function initAll() {
    // await initConfigs(api);
    // await initRooms(api);
    // await initNodes(api);
    // await initItems(api);
    // await initNpcs(api);
    // await initQuests(api);
    // await initSkills(api);
    // await initTraits(api);
    // await initRelationships(api);
    // await initGoals(api);

    await initGachaPool(api, 333);
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

function writeOutput(data: string[]) {
  // let result = `{\n"calls":\n` + JSON.stringify(data, null, 2) + '\n}';
  let result = `{\n  "calls": [\n` + data.join(',\n') + '\n  ]\n}';
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, '../contracts/', 'initStream.json'), result, {
    encoding: 'utf8',
  });
}

run();
