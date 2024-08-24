import {
  deleteFactions,
  deleteGoals,
  deleteItems,
  deleteNodes,
  deleteQuests,
  deleteRelationships,
  deleteRooms,
  deleteSkills,
  initAll,
  initAllLocal,
  initAuth,
  initConfigs,
  initFactions,
  initGachaPool,
  initGoals,
  initItems,
  initNodes,
  initNpcs,
  initQuests,
  initRelationships,
  initRooms,
  initSkills,
  initTraits,
  reviseFactions,
  reviseItems,
  reviseNodes,
  reviseQuests,
  reviseRooms,
  reviseSkills,
} from './state';

import { AdminAPI, createAdminAPI } from './admin';
import { initRecipes } from './state/recipes';

export type WorldAPI = typeof WorldState.prototype.api;

export type SubFunc = {
  init: (indices?: number[]) => Promise<void>;
  delete?: (indices?: number[]) => Promise<void>;
  revise?: (indices?: number[]) => Promise<void>;
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
    auth: {
      init: () => this.genCalls(initAuth),
    },
    config: {
      init: () => this.genCalls(initConfigs),
    } as SubFunc,
    faction: {
      init: () => this.genCalls(initFactions),
      delete: (indices: number[]) => this.genCalls((api) => deleteFactions(api, indices)),
      revise: (indices: number[]) => this.genCalls((api) => reviseFactions(api, indices)),
    } as SubFunc,
    goals: {
      init: () => this.genCalls(initGoals),
      delete: (indices: number[]) => this.genCalls((api) => deleteGoals(api, indices)),
    } as SubFunc,
    items: {
      init: (indices?: number[]) => this.genCalls((api) => initItems(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteItems(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseItems(api, indices)),
    } as SubFunc,
    npcs: {
      init: () => this.genCalls(initNpcs),
    } as SubFunc,
    nodes: {
      init: (indices?: number[]) => this.genCalls((api) => initNodes(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteNodes(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseNodes(api, indices)),
    } as SubFunc,
    mint: {
      init: () => this.genCalls((api) => initGachaPool(api, 333)),
    } as SubFunc,
    quests: {
      init: (indices?: number[]) => this.genCalls((api) => initQuests(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteQuests(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseQuests(api, indices)),
    } as SubFunc,
    recipes: {
      init: (indices?: number[]) => this.genCalls((api) => initRecipes(api)),
    },
    relationships: {
      init: () => this.genCalls(initRelationships),
      delete: (npcs: number[], indices?: number[]) =>
        this.genCalls((api) => deleteRelationships(api, indices || [], npcs)),
    } as SubFunc,
    rooms: {
      init: (indices?: number[]) => this.genCalls((api) => initRooms(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteRooms(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseRooms(api, indices)),
    } as SubFunc,
    skills: {
      init: (indices?: number[]) => this.genCalls((api) => initSkills(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteSkills(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseSkills(api, indices)),
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
