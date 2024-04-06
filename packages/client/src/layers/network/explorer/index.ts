import { Component, EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { getAccountByIndex, getAllAccounts } from 'layers/network/shapes/Account';
import { getAllItems, getItemByIndex } from 'layers/network/shapes/Item';
import { getAllKamis, getKamiByIndex } from 'layers/network/shapes/Kami';
import { getAllMerchants, getMerchantByIndex } from 'layers/network/shapes/Merchant';
import { getAllNodes, getNodeByIndex } from 'layers/network/shapes/Node';
import { getQuestByIndex, getRegistryQuests } from 'layers/network/shapes/Quest';
import { getAllRooms, getRoomByIndex } from 'layers/network/shapes/Room';
import { getRegistrySkills, getSkillByIndex } from 'layers/network/shapes/Skill';
import { getRegistryTraits, getTraitByIndex } from 'layers/network/shapes/Trait';

// explorer for our 'shapes', exposed on the window object @ network.explorer
// TODO: implement Item, Quest, Skill, Trait paths (registries)
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
    account: {
      get: (index: number, options?: {}) => {
        return getAccountByIndex(world, components, index, options);
      },
      getAll: (options?: {}) => getAllAccounts(world, components, options),
      entities: () => Array.from(components.IsAccount.entities()),
      indices: () => Array.from(components.AccountIndex.values.value.values()),
    },

    kami: {
      get: (index: number, options?: {}) => {
        return getKamiByIndex(world, components, index, options);
      },
      getAll: (options?: {}) => getAllKamis(world, components, options),
      entities: () => Array.from(components.IsPet.entities()),
      indices: () => Array.from(components.PetIndex.values.value.values()),
    },

    node: {
      get: (index: number, options?: {}) => {
        return getNodeByIndex(world, components, index, options);
      },
      getAll: (options?: {}) => getAllNodes(world, components, options),
      entities: () => Array.from(components.IsNode.entities()),
      indices: () => Array.from(components.NodeIndex.values.value.values()),
    },

    npc: {
      get: (index: number, options?: {}) => {
        return getMerchantByIndex(world, components, index);
      },
      getAll: (options?: {}) => getAllMerchants(world, components),
      entities: () => Array.from(components.IsNPC.entities()),
      indices: () => Array.from(components.NPCIndex.values.value.values()),
    },

    room: {
      get: (index: number, options?: {}) => {
        return getRoomByIndex(world, components, index, options);
      },
      getAll: (options?: {}) => getAllRooms(world, components, options),
      entities: () => Array.from(components.IsRoom.entities()),
      indices: () => Array.from(components.RoomIndex.values.value.values()),
    },

    /////////////////
    // REGISTRIES

    item: {
      get: (index: number) => getItemByIndex(world, components, index),
      getAll: () => getAllItems(world, components),
      indices: () => [...new Set(Array.from(components.ItemIndex.values.value.values()))],
    },

    quest: {
      get: (index: number) => getQuestByIndex(world, components, index),
      getAll: () => getRegistryQuests(world, components),
      indices: () => [...new Set(Array.from(components.QuestIndex.values.value.values()))],
    },

    skill: {
      get: (index: number, options?: {}) => getSkillByIndex(world, components, index, options),
      getAll: () => getRegistrySkills(world, components),
      indices: () => [...new Set(Array.from(components.SkillIndex.values.value.values()))],
    },

    trait: {
      get: (index: number, type: string) => getTraitByIndex(world, components, index, type),
      getAll: () => getRegistryTraits(world, components),
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
    entity: {
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
