import { ExternalProvider } from '@ethersproject/providers';
import { Type, createWorld, defineComponent } from '@mud-classic/recs';

import { createNetworkConfig } from 'layers/network';
import { SystemAbis } from 'types/SystemAbis.mjs';
import { SystemTypes } from 'types/SystemTypes';
import { createAdminAPI, createPlayerAPI, setupWorldAPI } from './api';
import { createComponents } from './components';
import { initExplorer } from './explorer';
import { SetupContractConfig, setupMUDNetwork } from './setup';
import { createActionSystem, createNotificationSystem } from './systems';
import { createNetwork } from './workers';

export type World = ReturnType<typeof createWorld>;
export type NetworkLayer = Awaited<ReturnType<typeof createNetworkLayer>>;

export async function createNetworkLayer(config: SetupContractConfig) {
  const world = createWorld();
  const components = createComponents(world);

  const { network, startSync, systems, createSystems, txReduced$ } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(world, components, SystemAbis, config, { fetchSystemCalls: true });

  const provider = network.providers.get().json;
  if (!provider) throw new Error('no Provider.. provided by network');

  const actions = createActionSystem(world, txReduced$, provider);
  const notifications = createNotificationSystem(world);

  let networkLayer = {
    world,
    network,
    actions,
    components,
    notifications,
    startSync,
    systems, // SystemExecutor
    createSystems, // SystemExecutor factory function
    api: {
      admin: createAdminAPI(systems),
      player: createPlayerAPI(systems),
      world: setupWorldAPI(systems, provider),
    },
    updates: {
      components: {
        Network: defineComponent(world, { value: Type.Boolean }), // local comp to tiggers updates
      },
    },
    explorer: initExplorer(world, components),
  };

  return networkLayer;
}

// Update the actual network instance of the network layer as well as the api
// from the newly initialized System Executor, using a new provider
export async function updateNetworkLayer(layer: NetworkLayer, provider: ExternalProvider) {
  const networkConfig = createNetworkConfig(provider);
  if (!networkConfig) throw new Error('Invalid config');

  // create api for the new network
  // NOTE: may be inefficient but easiest workaround to create MUD's boutique signer
  const networkInstance = await createNetwork(networkConfig);
  const systems = layer.createSystems(networkInstance);
  layer.network = networkInstance;
  layer.systems = systems;
  layer.api = {
    admin: createAdminAPI(systems),
    player: createPlayerAPI(systems),
    world: setupWorldAPI(systems, provider),
  };
}
