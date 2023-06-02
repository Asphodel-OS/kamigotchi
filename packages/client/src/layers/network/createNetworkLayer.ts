import { createFaucetService } from "@latticexyz/network";
import { createWorld } from "@latticexyz/recs";
import {
  SetupContractConfig,
  createActionSystem,
  setupMUDNetwork,
} from "@latticexyz/std-client";

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

  const actions = createActionSystem(world, txReduced$);

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
    api: {
      admin: adminAPI,
      player: playerAPI,
      world: worldAPI,
    },
    faucet,
  };

  return context;
}
