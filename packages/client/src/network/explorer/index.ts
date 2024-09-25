import { Component, EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  AccountOptions,
  getAccountByID,
  getAccountByIndex,
  getAccountByName,
  getAccountByOwner,
  getAccountMusuRankings,
  getAccountRepRankings,
  getAllAccounts,
  queryAccountByIndex,
} from 'network/shapes/Account';
import { getByOperator } from 'network/shapes/Account/getters';
import { getConfigFieldValue, getConfigFieldValueArray } from 'network/shapes/Config';
import { getConfigFieldValueAddress } from 'network/shapes/Config/types';
import { getAllFactions, getFactionByIndex } from 'network/shapes/Faction';
import { getAllGoals, getGoalByIndex } from 'network/shapes/Goal';
import { getAllItems, getItemByIndex } from 'network/shapes/Item';
import { KamiOptions, getAllKamis, getKamiByIndex } from 'network/shapes/Kami';
import { NodeOptions, getAllNodes, getNodeByIndex } from 'network/shapes/Node';
import { getAllNPCs, getNPCByIndex } from 'network/shapes/NPCs';
import {
  getQuest,
  getQuestByIndex,
  queryAcceptedQuests,
  queryRegistryQuests,
} from 'network/shapes/Quest';
import { getAllRooms, getRoomByIndex } from 'network/shapes/Room';
import { getRegistrySkills, getSkillByIndex } from 'network/shapes/Skill';
import { getRegistryTraits, getTraitByIndex } from 'network/shapes/Trait';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initExplorer = (world: World, components: Components) => {
  // parses a component value based on its schema
  function parseValue(c: Component, v: any) {
    const type = c.schema.value;
    if (type === 0) return v; // boolean
    if (type === 3) return v; // string
    if (type === 1) return parseInt(v, 16); // number
    if (type === 5) return v.map((s: string) => parseInt(s, 16)); // number[]
    return v;
  }

  // gets an entity by its entity index
  function getEntity(index: EntityIndex) {
    const entity = {} as any;
    Object.values(components).forEach((component) => {
      // @ts-ignore
      const valueish = getComponentValue(component, index);
      if (valueish) {
        entity[component.id] = parseValue(component, valueish.value);
      }
    });
    return entity;
  }

  return {
    accounts: {
      all: (options?: AccountOptions) => getAllAccounts(world, components, options),
      get: (index: number) => getAccountByIndex(world, components, index, fullAccountOptions),
      getByID: (id: EntityID) => getAccountByID(world, components, id, fullAccountOptions),
      getByOwner: (owner: string) =>
        getAccountByOwner(world, components, owner.toLowerCase(), fullAccountOptions),
      getByOperator: (operator: string) =>
        getByOperator(world, components, operator.toLowerCase(), fullAccountOptions),
      getByName: (name: string) => getAccountByName(world, components, name, fullAccountOptions),
      entities: () => Array.from(components.IsAccount.entities()),
      indices: () => Array.from(components.AccountIndex.values.value.values()),
      rankings: {
        musu: (limit?: number) => getAccountMusuRankings(world, components, limit),
        reputation: (limit?: number) => getAccountRepRankings(world, components, limit),
      },
    },

    config: {
      get: (name: string) => getConfigFieldValue(world, components, name),
      getArray: (name: string) => getConfigFieldValueArray(world, components, name),
      getAddress: (name: string) => getConfigFieldValueAddress(world, components, name),
    },

    goals: {
      all: () => getAllGoals(world, components),
      get: (index: number) => getGoalByIndex(world, components, index),
    },

    factions: {
      all: () => getAllFactions(world, components),
      get: (index: number) => getFactionByIndex(world, components, index),
      indices: () => Array.from(components.FactionIndex.values.value.values()),
    },

    kamis: {
      all: (options?: KamiOptions) => getAllKamis(world, components, options),
      get: (index: number, options?: {}) => {
        return getKamiByIndex(world, components, index, options);
      },
      entities: () => Array.from(components.IsPet.entities()),
      indices: () => Array.from(components.PetIndex.values.value.values()),
    },

    nodes: {
      all: (options?: NodeOptions) => getAllNodes(world, components, options),
      get: (index: number, options?: {}) => {
        return getNodeByIndex(world, components, index, options);
      },
      entities: () => Array.from(components.IsNode.entities()),
      indices: () => Array.from(components.NodeIndex.values.value.values()),
    },

    npc: {
      all: (options?: {}) => getAllNPCs(world, components),
      get: (index: number, options?: {}) => {
        return getNPCByIndex(world, components, index);
      },
      entities: () => Array.from(components.IsNPC.entities()),
      indices: () => Array.from(components.NPCIndex.values.value.values()),
    },

    rooms: {
      all: (options?: {}) => getAllRooms(world, components, options),
      get: (index: number, options?: {}) => {
        return getRoomByIndex(world, components, index, options);
      },
      entities: () => Array.from(components.IsRoom.entities()),
      indices: () => Array.from(components.RoomIndex.values.value.values()),
    },

    /////////////////
    // REGISTRIES

    items: {
      all: () => getAllItems(world, components),
      get: (index: number) => getItemByIndex(world, components, index),
      indices: () => [...new Set(Array.from(components.ItemIndex.values.value.values()))],
    },

    quests: {
      all: () => {
        const entities = queryRegistryQuests(components);
        const quests = entities.map((entity) => getQuest(world, components, entity));
        return quests.sort((a, b) => a.index - b.index);
      },
      get: (index: number) => getQuestByIndex(world, components, index),
      getForAccount: (accountIndex: number) => {
        const accEntity = queryAccountByIndex(components, accountIndex) as EntityIndex;
        const accountID = world.entities[accEntity];
        const entities = queryAcceptedQuests(components, accountID);
        const quests = entities.map((entity) => getQuest(world, components, entity));
        return quests.sort((a, b) => a.index - b.index);
      },
      indices: () => [...new Set(Array.from(components.QuestIndex.values.value.values()))],
    },

    skills: {
      all: () => getRegistrySkills(world, components),
      get: (index: number, options?: {}) => getSkillByIndex(world, components, index, options),
      indices: () => [...new Set(Array.from(components.SkillIndex.values.value.values()))],
    },

    traits: {
      get: (index: number, type: string) => getTraitByIndex(components, index, type),
      all: () => getRegistryTraits(world, components),
      indices: () => [
        ...new Set([
          ...Array.from(components.BackgroundIndex.values.value.values()),
          ...Array.from(components.BodyIndex.values.value.values()),
          ...Array.from(components.ColorIndex.values.value.values()),
          ...Array.from(components.FaceIndex.values.value.values()),
          ...Array.from(components.HandIndex.values.value.values()),
        ]),
      ],
    },

    // helper function to get all the set components values for a given entity
    entities: {
      get: (index: EntityIndex) => {
        return getEntity(index);
      },
      getByID: (id: EntityID) => {
        const index = world.entityToIndex.get(id);
        if (index) return getEntity(index);
      },
    },
  };
};

const fullAccountOptions: AccountOptions = {
  kamis: true,
  friends: true,
  inventory: true,
  stats: true,
};
