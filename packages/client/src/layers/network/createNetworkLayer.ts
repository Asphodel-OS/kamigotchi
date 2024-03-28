import { Type, createWorld, defineComponent } from '@mud-classic/recs';

import { SetupContractConfig, setupMUDNetwork } from 'layers/network/setup';
import { SystemAbis } from 'types/SystemAbis.mjs';
import { SystemTypes } from 'types/SystemTypes';
import { createAdminAPI } from './api/admin';
import { createPlayerAPI } from './api/player';
import { setUpWorldAPI } from './api/world';
import { createComponents } from './components/register';
import { initExplorer } from './explorer';
import { createActionSystem } from './systems/ActionSystem/createActionSystem';
import { createNotificationSystem } from './systems/NotificationSystem/createNotificationSystem';

export async function createNetworkLayer(config: SetupContractConfig) {
  const world = createWorld();
  const components = createComponents(world);

  const { network, startSync, systems, createSystems, txReduced$ } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(world, components, SystemAbis, config, { fetchSystemCalls: true });

  let actions;
  const provider = network.providers.get().json;
  if (provider) actions = createActionSystem(world, txReduced$, provider);
  const notifications = createNotificationSystem(world);

  // local component to trigger updates
  // effectively a hopper to make EOA wallet updates compatible with phaser
  // could be extended to replace clunky streams in react
  const NetworkUpdater = defineComponent(world, { value: Type.Boolean });

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
      world: setUpWorldAPI(systems, provider),
    },
    updates: {
      components: {
        Network: defineComponent(world, { value: Type.Boolean }), // no clue how this is working..
      },
    },
    explorer: {} as any,
  };

  initExplorer(networkLayer);
  return networkLayer;
}
