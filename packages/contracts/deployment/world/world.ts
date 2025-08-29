import { AdminAPI, createAdminAPI } from './api';
import {
  addNodeScavenges,
  deleteAuctions,
  deleteFactions,
  deleteGoalRewards,
  deleteGoals,
  deleteItems,
  deleteListings,
  deleteNodes,
  deleteQuests,
  deleteRecipes,
  deleteRelationships,
  deleteRooms,
  deleteSkills,
  deleteToken,
  initAll,
  initAllLocal,
  initAllTesting,
  initAuctions,
  initAuth,
  initConfigs,
  initFactions,
  initGachaPool,
  initGoals,
  initHarvestConfigs,
  initItems,
  initLiquidationConfigs,
  initListings,
  initMintConfigs,
  initNodes,
  initNpcs,
  initPortal,
  initQuests,
  initRecipes,
  initRelationships,
  initRooms,
  initSkills,
  initSnapshot,
  initTradeConfigs,
  initTraits,
  mintToGachaPool,
  reviseAuctions,
  reviseFactions,
  reviseItems,
  reviseListings,
  reviseNodes,
  reviseNodeScavenges,
  reviseQuests,
  reviseRecipes,
  reviseRooms,
  reviseSkills,
} from './state';

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
    init: () => this.genCalls((api) => initAll(api)),
    local: {
      init: () => this.genCalls((api) => initAllLocal(api)),
    } as SubFunc,
    testing: {
      init: () => this.genCalls((api) => initAllTesting(api)),
    },
    admin: {
      batchMint: (amt: number[]) => this.genCalls((api) => mintToGachaPool(api, amt)),
    },
    auctions: {
      init: (indices?: number[]) => this.genCalls((api) => initAuctions(api, indices)),
      delete: (indices: number[]) => this.genCalls((api) => deleteAuctions(api, indices)),
      revise: (indices: number[]) => this.genCalls((api) => reviseAuctions(api, indices)),
    },
    auth: {
      init: () => this.genCalls(initAuth),
    },
    bridge: {
      init: () => this.genCalls(initPortal),
      delete: (index: number) => this.genCalls((api) => deleteToken(api, index)),
    },
    config: {
      init: () => this.genCalls(initConfigs),
      initMint: () => this.genCalls(initMintConfigs),
      initHarvest: () => this.genCalls(initHarvestConfigs),
      initLiquidation: () => this.genCalls(initLiquidationConfigs),
      initTrade: () => this.genCalls(initTradeConfigs),
    } as SubFunc,
    factions: {
      init: () => this.genCalls(initFactions),
      delete: (indices: number[]) => this.genCalls((api) => deleteFactions(api, indices)),
      revise: (indices: number[]) => this.genCalls((api) => reviseFactions(api, indices)),
    } as SubFunc,
    goals: {
      init: () => this.genCalls(initGoals),
      delete: (indices: number[]) => this.genCalls((api) => deleteGoals(api, indices)),
      deleteRewards: (indices: number[]) => this.genCalls((api) => deleteGoalRewards(api, indices)),
    },
    items: {
      init: (indices?: number[]) => this.genCalls((api) => initItems(api, indices)),
      delete: (indices: number[]) => this.genCalls((api) => deleteItems(api, indices)),
      revise: (indices: number[]) => this.genCalls((api) => reviseItems(api, indices)),
    } as SubFunc,
    listings: {
      init: (indices?: number[]) => this.genCalls((api) => initListings(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteListings(api, indices || [])),
      revise: (indices?: number[]) => this.genCalls((api) => reviseListings(api, indices)),
    },
    npcs: {
      init: () => this.genCalls(initNpcs),
    } as SubFunc,
    nodes: {
      init: (indices?: number[]) => this.genCalls((api) => initNodes(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteNodes(api, indices)),
      revise: (indices?: number[]) => this.genCalls((api) => reviseNodes(api, indices)),
      addScavenges: (indices?: number[]) => this.genCalls((api) => addNodeScavenges(api, indices)),
      reviseScavenges: (indices?: number[]) =>
        this.genCalls((api) => reviseNodeScavenges(api, indices)),
    } as SubFunc,
    mint: {
      init: () => this.genCalls((api) => initGachaPool(api, 333)),
    } as SubFunc,
    quests: {
      init: (indices?: number[]) => this.genCalls((api) => initQuests(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteQuests(api, indices)),
      revise: (indices?: number[]) => this.genCalls((api) => reviseQuests(api, indices)),
    } as SubFunc,
    recipes: {
      init: (indices?: number[]) => this.genCalls((api) => initRecipes(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteRecipes(api, indices)),
      revise: (indices?: number[]) => this.genCalls((api) => reviseRecipes(api, indices)),
    },
    relationships: {
      init: () => this.genCalls(initRelationships),
      delete: (npcs: number[], indices?: number[]) =>
        this.genCalls((api) => deleteRelationships(api, indices || [], npcs)),
    } as SubFunc,
    rooms: {
      init: (indices?: number[]) => this.genCalls((api) => initRooms(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteRooms(api, indices)),
      revise: (indices?: number[]) => this.genCalls((api) => reviseRooms(api, indices)),
    } as SubFunc,
    skills: {
      init: (indices?: number[]) => this.genCalls((api) => initSkills(api, indices)),
      delete: (indices?: number[]) => this.genCalls((api) => deleteSkills(api, indices)),
      revise: (indices?: number[]) => this.genCalls((api) => reviseSkills(api, indices)),
    } as SubFunc,
    snapshot: {
      init: () => this.genCalls(initSnapshot),
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
  console.log(`** Wrote ${path.join(__dirname, '../contracts/', 'initStream.json')}**`);
}
