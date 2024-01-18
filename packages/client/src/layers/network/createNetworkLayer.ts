import { GodID, createFaucetService } from "@latticexyz/network";
import {
  Component,
  EntityIndex,
  createWorld,
  getComponentValue,
  defineComponent,
  Type,
  setComponent
} from "@latticexyz/recs";
import {
  SetupContractConfig,
  setupMUDNetwork,
} from "@latticexyz/std-client";

import { createActionSystem } from "./LocalSystems/ActionSystem/createActionSystem";
import { createNotificationSystem } from "./LocalSystems/NotificationSystem/createNotificationSystem";
import { SystemTypes } from "types/SystemTypes";
import { SystemAbis } from "types/SystemAbis.mjs";
import { createAdminAPI } from "./api/admin";
import { createPlayerAPI } from "./api/player";
import { setUpWorldAPI } from "./api/world";
import { createComponents } from "./components/register";

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

  const provider = network.providers.get().json;
  let actions;
  if (provider) {
    actions = createActionSystem(world, txReduced$, provider);
  }
  const notifications = createNotificationSystem(world);

  /////////////////
  // API

  // @ts-ignore ignoring errors here since we do populate the network config object with this field
  const faucet = config.faucetServiceUrl ? createFaucetService(config.faucetServiceUrl) : undefined;
  async function dripDev() {
    console.info("[Dev Faucet] Dripping funds to player");
    const address = network.connectedAddress.get();
    return address && faucet?.dripDev({ address });
  }
  if (faucet) await dripDev();


  const adminAPI = createAdminAPI(systems);
  const playerAPI = createPlayerAPI(systems);
  const worldAPI = setUpWorldAPI(systems);

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

  // helper function to get all the set components values for a given entity
  const getEntity = (index: EntityIndex): any => {
    const entity = {} as any;

    function parseValue(c: Component, v: any) {
      const type = c.schema.value;
      if (type === 0) return v; // boolean
      if (type === 3) return v; // string
      if (type === 1) return parseInt(v, 16); // number
      if (type === 5) return v.map((s: string) => parseInt(s, 16)); // number[] 
      return v;
    }

    Object.values(components).forEach((component) => {
      // @ts-ignore
      const valueish = getComponentValue(component, index);
      if (valueish) {
        entity[component.id] = parseValue(component, valueish.value);
      }
    });
    return entity;
  };

  // --- CONTEXT --------------------------------------------------------------------
  const context = {
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
      admin: adminAPI,
      player: playerAPI,
      world: worldAPI,
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
      getEntity,
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
    faucet,
  };

  return context;
}
