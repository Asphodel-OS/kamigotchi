import { Component, EntityIndex, getComponentValue } from '@latticexyz/recs';

import { NetworkLayer } from '../types';
import {
  getAccountByIndex,
  getAllAccounts,
} from 'layers/network/shapes/Account';
import { getKamiByIndex, getAllKamis } from 'layers/network/shapes/Kami';
import { getAllMerchants, getMerchantByIndex } from '../shapes/Merchant';
import { getNodeByIndex, getAllNodes } from 'layers/network/shapes/Node';
import { getRoomByIndex, getAllRooms } from 'layers/network/shapes/Room';
import { numberToHex } from 'utils/hex';

// explorer for our 'shapes', exposed on the window object @ network.explorer
// TODO: implement Item, Quest, Skill, Trait paths (registries)
export const initExplorer = (network: NetworkLayer) => {
  let explorer = network.explorer;
  const { components } = network;

  explorer.account = {
    get: (index: number, options?: {}) => {
      return getAccountByIndex(network, numberToHex(index), options);
    },
    getAll: (options?: {}) => getAllAccounts(network, options),
    entities: () => Array.from(components.IsAccount.entities()),
    indices: () => Array.from(components.AccountIndex.values.value.values()),
  };

  explorer.kami = {
    get: (index: number, options?: {}) => {
      return getKamiByIndex(network, numberToHex(index), options);
    },
    getAll: (options?: {}) => getAllKamis(network, options),
    entities: () => Array.from(components.IsPet.entities()),
    indices: () => Array.from(components.PetIndex.values.value.values()),
  };

  explorer.node = {
    get: (index: number, options?: {}) => {
      return getNodeByIndex(network, numberToHex(index), options);
    },
    getAll: (options?: {}) => getAllNodes(network, options),
    entities: () => Array.from(components.IsNode.entities()),
    indices: () => Array.from(components.NodeIndex.values.value.values()),
  };

  explorer.npc = {
    get: (index: number, options?: {}) => {
      return getMerchantByIndex(network, numberToHex(index));
    },
    getAll: (options?: {}) => getAllMerchants(network),
    entities: () => Array.from(components.IsNPC.entities()),
    indices: () => Array.from(components.NPCIndex.values.value.values()),
  };

  explorer.room = {
    get: (index: number, options?: {}) => {
      return getRoomByIndex(network, numberToHex(index), options);
    },
    getAll: (options?: {}) => getAllRooms(network, options),
    entities: () => Array.from(components.IsRoom.entities()),
    indices: () => Array.from(components.RoomIndex.values.value.values()),
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
