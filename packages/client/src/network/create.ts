import { ExternalProvider } from '@ethersproject/providers';
import { Type, createWorld, defineComponent } from '@mud-classic/recs';

import { createNetwork } from 'engine/executors';
import { SystemAbis } from 'types/SystemAbis';
import { SystemTypes } from 'types/SystemTypes';
import { createAdminAPI, createPlayerAPI } from './api';
import { createComponents } from './components';
import { createConfig } from './config';
import { initExplorer } from './explorer';
import { initPlayground } from './playground';
import { SetupContractConfig, setupMUDNetwork } from './setup';
import { createActionSystem, createNotificationSystem } from './systems';
import { createDTRevealerSystem } from './systems/DTRevealerSystem';

export type NetworkLayer = Awaited<ReturnType<typeof createNetworkLayer>>;

// create and return a full network layer
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
  const api = { admin: createAdminAPI(systems), player: createPlayerAPI(systems) };

  // local systems
  const DTRevealer = createDTRevealerSystem(
    world,
    components,
    network.blockNumber$,
    actions,
    notifications,
    api.player
  );

  let networkLayer = {
    world,
    network,
    actions, // global system
    notifications, // global system
    components,
    startSync,
    systems, // SystemExecutor
    createSystems, // SystemExecutor factory function
    api: api,
    localSystems: {
      DTRevealer,
    },
    updates: {
      components: {
        Network: defineComponent(world, { value: Type.Boolean }), // local comp to tiggers updates
      },
    },
    explorer: initExplorer(world, components),
    playground: initPlayground(world, components, api),
  };

  return networkLayer;
}

// Create a network instance using the provided provider.
// Uses private key in localstorage if no provider is provided.
export async function createNetworkInstance(provider?: ExternalProvider) {
  const networkConfig = createConfig(provider);
  if (!networkConfig) throw new Error('Invalid config');
  const network = await createNetwork(networkConfig);
  return network;
}

// Create a newly initialized System Executor, using a new provider.
// Update the network/systems/api of the network layer, if one is provided.
export async function updateNetworkLayer(layer: NetworkLayer, provider?: ExternalProvider) {
  const networkInstance = await createNetworkInstance(provider);
  const systems = layer.createSystems(networkInstance);
  layer.network = networkInstance;
  layer.systems = systems;
  layer.api = {
    admin: createAdminAPI(systems),
    player: createPlayerAPI(systems),
  };
  return layer;
}
