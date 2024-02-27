import { Component, EntityIndex, getComponentValue } from '@latticexyz/recs';

import { getAccountByIndex, getAllAccounts } from 'layers/network/shapes/Account';
import { getAllKamis, getKamiByIndex } from 'layers/network/shapes/Kami';
import { getAllNodes, getNodeByIndex } from 'layers/network/shapes/Node';
import { getAllRooms, getRoomByIndex } from 'layers/network/shapes/Room';
import { getAllItems, getItemByIndex } from '../shapes/Item';
import { getAllMerchants, getMerchantByIndex } from '../shapes/Merchant';
import { getQuestByIndex, getRegistryQuests } from '../shapes/Quest';
import { getRegistrySkills, getSkillByIndex } from '../shapes/Skill';
import { getRegistryTraits, getTraitByIndex } from '../shapes/Trait';
import { NetworkLayer } from '../types';

// explorer for our 'shapes', exposed on the window object @ network.explorer
// TODO: implement Item, Quest, Skill, Trait paths (registries)
export const initExplorer = (network: NetworkLayer) => {
  let explorer = network.explorer;
  const { components } = network;

  /////////////////
  // INSTANCES

  explorer.account = {
    get: (index: number, options?: {}) => {
      return getAccountByIndex(network, index, options);
    },
    getAll: (options?: {}) => getAllAccounts(network, options),
    entities: () => Array.from(components.IsAccount.entities()),
    indices: () => Array.from(components.AccountIndex.values.value.values()),
  };

  explorer.kami = {
    get: (index: number, options?: {}) => {
      return getKamiByIndex(network, index, options);
    },
    getAll: (options?: {}) => getAllKamis(network, options),
    entities: () => Array.from(components.IsPet.entities()),
    indices: () => Array.from(components.PetIndex.values.value.values()),
  };

  explorer.node = {
    get: (index: number, options?: {}) => {
      return getNodeByIndex(network, index, options);
    },
    getAll: (options?: {}) => getAllNodes(network, options),
    entities: () => Array.from(components.IsNode.entities()),
    indices: () => Array.from(components.NodeIndex.values.value.values()),
  };

  explorer.npc = {
    get: (index: number, options?: {}) => {
      return getMerchantByIndex(network, index);
    },
    getAll: (options?: {}) => getAllMerchants(network),
    entities: () => Array.from(components.IsNPC.entities()),
    indices: () => Array.from(components.NPCIndex.values.value.values()),
  };

  explorer.room = {
    get: (index: number, options?: {}) => {
      return getRoomByIndex(network, index, options);
    },
    getAll: (options?: {}) => getAllRooms(network, options),
    entities: () => Array.from(components.IsRoom.entities()),
    indices: () => Array.from(components.RoomIndex.values.value.values()),
  };

  /////////////////
  // REGISTRIES

  explorer.item = {
    get: (index: number) => getItemByIndex(network, index),
    getAll: () => getAllItems(network),
    indices: () => [...new Set(Array.from(components.ItemIndex.values.value.values()))],
  };

  explorer.quest = {
    get: (index: number) => getQuestByIndex(network, index),
    getAll: () => getRegistryQuests(network),
    indices: () => [...new Set(Array.from(components.QuestIndex.values.value.values()))],
  };

  explorer.skill = {
    get: (index: number, options?: {}) => getSkillByIndex(network, index, options),
    getAll: () => getRegistrySkills(network),
    indices: () => [...new Set(Array.from(components.SkillIndex.values.value.values()))],
  };

  explorer.trait = {
    get: (index: number) => getTraitByIndex(network, index),
    getAll: () => getRegistryTraits(network),
    indices: () => [...new Set(Array.from(components.TraitIndex.values.value.values()))],
  };

  // helper function to get all the set components values for a given entity
  explorer.getEntity = (index: EntityIndex): any => {
    const entity = {} as any;

    function parseValue(c: Component, v: any) {
      const type = c.schema.value;
      if (type === 0) return v; // boolean
      if (type === 3) return v; // string
      if (type === 1) return parseInt(v, 16); // number
      if (type === 5) return v.map((s: string) => parseInt(s, 16)); // number[]
      return v;
    }

    Object.values(network.components).forEach((component) => {
      // @ts-ignore
      const valueish = getComponentValue(component, index);
      if (valueish) {
        entity[component.id] = parseValue(component, valueish.value);
      }
    });
    return entity;
  };
};
