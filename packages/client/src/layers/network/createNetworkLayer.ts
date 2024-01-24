import { GodID } from "@latticexyz/network";
import {
  Component,
  EntityIndex,
  Type,
  createWorld,
  defineComponent,
  getComponentValue,
  setComponent
} from "@latticexyz/recs";
import { SetupContractConfig, setupMUDNetwork } from "@latticexyz/std-client";

import { NetworkLayer } from "./types";
import { createAdminAPI } from "./api/admin";
import { createPlayerAPI } from "./api/player";
import { setUpWorldAPI } from "./api/world";
import { createComponents } from "./components/register";
import { createActionSystem } from "./LocalSystems/ActionSystem/createActionSystem";
import { createNotificationSystem } from "./LocalSystems/NotificationSystem/createNotificationSystem";
import { getKamiByIndex } from 'layers/network/shapes/Kami';
import { getAccountByIndex } from 'layers/network/shapes/Account';
import { getItemByIndex } from 'layers/network/shapes/Item';
import { getNodeByIndex } from 'layers/network/shapes/Node';
import { getQuestByIndex } from 'layers/network/shapes/Quest';
import { getRoomByLocation } from 'layers/network/shapes/Room';
import { getSkillByIndex } from 'layers/network/shapes/Skill';
import { getTraitByIndex } from 'layers/network/shapes/Trait';
import { SystemTypes } from "types/SystemTypes";
import { SystemAbis } from "types/SystemAbis.mjs";
import { numberToHex } from 'utils/hex';

export async function createNetworkLayer(config: SetupContractConfig) {
  const world = createWorld();
  const components = createComponents(world);

  const {
    txQueue,
    systems,
    txReduced$,
    network,
    startSync,
  } = await setupMUDNetwork<typeof components, SystemTypes>(
    config,
    world,
    components,
    SystemAbis,
    {
      fetchSystemCalls: true,
    },
  );

  let actions;
  const provider = network.providers.get().json;
  if (provider) actions = createActionSystem(world, txReduced$, provider);
  const notifications = createNotificationSystem(world);

  // local component to trigger updates
  // effectively a hopper to make EOA wallet updates compatible with phaser
  // could be extended to replace clunky streams in react
  const NetworkUpdater = defineComponent(world, { value: Type.Boolean });
  const UpdateNetwork = () => {
    const godEntityIndex = world.entityToIndex.get(GodID) as EntityIndex;
    let nextVal = false;
    if (getComponentValue(NetworkUpdater, godEntityIndex)?.value != undefined) {
      nextVal = !getComponentValue(NetworkUpdater, godEntityIndex)?.value;
    }
    setComponent(
      NetworkUpdater,
      godEntityIndex,
      { value: nextVal }
    );
  }

  let networkLayer = {
    world,
    components,
    txQueue,
    systems,
    txReduced$,
    startSync,
    network,
    actions,
    notifications,
    api: {
      admin: createAdminAPI(systems),
      player: createPlayerAPI(systems),
      world: setUpWorldAPI(systems),
    },
    updates: {
      components: {
        Network: NetworkUpdater,
      },
      functions: {
        UpdateNetwork,
      }
    },
    explorer: {
      getEntity: (index: EntityIndex) => { console.log("not implemented") },
      getAccount: (index: number, options?: {}) => { console.log("not implemented") },
      getItem: (index: number, options?: {}) => { console.log("not implemented") },
      getKami: (index: number, options?: {}) => { console.log("not implemented") },
      getNode: (index: number, options?: {}) => { console.log("not implemented") },
      getNPC: (index: number, options?: {}) => { console.log("not implemented") },
      getQuest: (index: number, options?: {}) => { console.log("not implemented") },
      getRoom: (location: number, options?: {}) => { console.log("not implemented") },
      getSkill: (index: number, options?: {}) => { console.log("not implemented") },
      getTrait: (index: number, options?: {}) => { console.log("not implemented") },
    },
  };

  initExplorer(networkLayer);
  return networkLayer;
}


const initExplorer = (network: NetworkLayer) => {
  let explorer = network.explorer;
  explorer.getAccount = (index: number, options?: {}) => {
    return getAccountByIndex(network, numberToHex(index), options);
  }
  explorer.getItem = (index: number, options?: {}) => {
    return getItemByIndex(network, numberToHex(index));
  }
  explorer.getKami = (index: number, options?: {}) => {
    return getKamiByIndex(network, numberToHex(index), options);
  }
  explorer.getNode = (index: number, options?: {}) => {
    return getNodeByIndex(network, index, options);
  }
  explorer.getQuest = (index: number, options?: {}) => {
    return getQuestByIndex(network, numberToHex(index));
  }
  explorer.getRoom = (location: number, options?: {}) => {
    return getRoomByLocation(network, location);
  }
  explorer.getSkill = (index: number, options?: {}) => {
    return getSkillByIndex(network, numberToHex(index));
  }
  explorer.getTrait = (index: number, options?: {}) => {
    return getTraitByIndex(network, numberToHex(index));
  }

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
}
