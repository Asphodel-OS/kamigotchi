import {
  deleteGoals,
  deleteItems,
  deleteNodes,
  deleteQuests,
  deleteRelationships,
  deleteRooms,
  deleteSkills,
  initAll,
  initAllLocal,
  initConfigs,
  initGachaPool,
  initGoals,
  initItems,
  initNodes,
  initNpcs,
  initQuests,
  initQuestsByIndex,
  initRelationships,
  initRooms,
  initRoomsByIndex,
  initSkills,
  initTraits,
} from './state';

import { AdminAPI, createAdminAPI } from './admin';

export type WorldAPI = typeof WorldState.prototype.api;

export type SubFunc = {
  init: () => Promise<void>;
  initByIndex?: (indices: number[]) => Promise<void>;
  delete?: (indices: number[]) => Promise<void>;
};

/**
 * This is adapted off world.ts from the client package.
 */
export class WorldState {
  compiledCalls: string[];
  adminAPI: AdminAPI;

  constructor() {
    this.compiledCalls = [];
    this.adminAPI = createAdminAPI(this.compiledCalls);
  }

  api = {
    init: (local: boolean) => this.genCalls((api) => initAll(api, local)),
    local: {
      init: () => this.genCalls((api) => initAllLocal(api)),
    } as SubFunc,
    config: {
      init: () => this.genCalls(initConfigs),
    } as SubFunc,
    goals: {
      init: () => this.genCalls(initGoals),
      delete: (indices: number[]) => this.genCalls((api) => deleteGoals(api, indices)),
    } as SubFunc,
    items: {
      init: () => this.genCalls(initItems),
      delete: (indices: number[]) => this.genCalls((api) => deleteItems(api, indices)),
    } as SubFunc,
    npcs: {
      init: () => this.genCalls(initNpcs),
    } as SubFunc,
    nodes: {
      init: () => this.genCalls(initNodes),
      delete: (indices: number[]) => this.genCalls((api) => deleteNodes(api, indices)),
    } as SubFunc,
    mint: {
      init: () => this.genCalls((api) => initGachaPool(api, 333)),
    } as SubFunc,
    quests: {
      init: () => this.genCalls(initQuests),
      initByIndex: (indices: number[]) => this.genCalls((api) => initQuestsByIndex(api, indices)),
      delete: (indices: number[]) => this.genCalls((api) => deleteQuests(api, indices)),
    } as SubFunc,
    relationships: {
      init: () => this.genCalls(initRelationships),
      delete: (npcs: number[], indices: number[]) =>
        this.genCalls((api) => deleteRelationships(api, indices, npcs)),
    } as SubFunc,
    rooms: {
      init: () => this.genCalls(initRooms),
      initByIndex: (indices: number[]) => this.genCalls((api) => initRoomsByIndex(api, indices)),
      delete: (indices: number[]) => this.genCalls((api) => deleteRooms(api, indices)),
    } as SubFunc,
    skills: {
      init: (indices?: number[]) => this.genCalls((api) => initSkills(api, indices)),
      delete: (indices: number[]) => this.genCalls((api) => deleteSkills(api, indices)),
    } as SubFunc,
    traits: {
      init: () => this.genCalls(initTraits),
      // delete: (indices: number[], types: string[]) =>
      //   genCalls((api) => deleteTraits(api, indices, types)),
    } as SubFunc,
  };

  async genCalls(func: (api: AdminAPI) => Promise<void>) {
    await func(this.adminAPI);
  }

  async writeCalls() {
    writeOutput(this.compiledCalls);
  }
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
