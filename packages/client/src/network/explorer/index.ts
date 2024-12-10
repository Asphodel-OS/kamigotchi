import {
  Component,
  EntityID,
  EntityIndex,
  World,
  getComponentValue,
  getEntitiesWithValue,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { AccountOptions } from 'network/shapes/Account';
import { getAllItems, getItemByIndex } from 'network/shapes/Item';
import { KamiOptions, getAllKamis, getKamiByIndex, getKamiByName } from 'network/shapes/Kami';
import { NodeOptions, getAllNodes, getNodeByIndex } from 'network/shapes/Node';
import { getAllNPCs, getNPCByIndex } from 'network/shapes/NPCs';
import { getAllRecipes, getRecipeByIndex } from 'network/shapes/Recipe';
import { getAllRooms, getRoomByIndex } from 'network/shapes/Room';
import { getRegistrySkills, getSkillByIndex } from 'network/shapes/Skill';
import { getRegistryTraits, getTraitByIndex } from 'network/shapes/Trait';
import { accounts } from './accounts';
import { configs } from './configs';
import { factions } from './factions';
import { goals } from './goals';
import { quests } from './quests';

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

  const { EntityType } = components;

  return {
    accounts: accounts(world, components),
    configs: configs(world, components),
    factions: factions(world, components),
    goals: goals(world, components),

    kamis: {
      all: (options?: KamiOptions) => getAllKamis(world, components, options),
      get: (index: number, options?: {}) => {
        return getKamiByIndex(world, components, index, options);
      },
      getByName: (name: string) => getKamiByName(world, components, name),
      entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'KAMI' })),
      indices: () => Array.from(components.KamiIndex.values.value.values()),
    },

    nodes: {
      all: (options?: NodeOptions) => getAllNodes(world, components),
      get: (index: number, options?: {}) => {
        return getNodeByIndex(world, components, index);
      },
      entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'NODE' })),
      indices: () => Array.from(components.NodeIndex.values.value.values()),
    },

    npc: {
      all: (options?: {}) => getAllNPCs(world, components),
      get: (index: number, options?: {}) => {
        return getNPCByIndex(world, components, index);
      },
      entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'NPC' })),
      indices: () => Array.from(components.NPCIndex.values.value.values()),
    },

    rooms: {
      all: (options?: {}) => getAllRooms(world, components, options),
      get: (index: number, options?: {}) => {
        return getRoomByIndex(world, components, index, options);
      },
      entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'ROOM' })),
      indices: () => Array.from(components.RoomIndex.values.value.values()),
    },

    /////////////////
    // REGISTRIES

    items: {
      all: () => getAllItems(world, components),
      get: (index: number) => getItemByIndex(world, components, index),
      indices: () => [...new Set(Array.from(components.ItemIndex.values.value.values()))],
    },

    recipes: {
      all: () => getAllRecipes(world, components),
      get: (index: number) => getRecipeByIndex(world, components, index),
    },

    quests: quests(world, components),
    skills: {
      all: () => getRegistrySkills(world, components),
      get: (index: number, options?: {}) => getSkillByIndex(world, components, index, options),
      indices: () => [...new Set(Array.from(components.SkillIndex.values.value.values()))],
    },

    traits: {
      get: (index: number, type: string) => getTraitByIndex(world, components, index, type),
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
