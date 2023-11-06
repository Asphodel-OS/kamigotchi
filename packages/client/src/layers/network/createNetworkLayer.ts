import {
  EntityIndex,
  Type,
  createWorld,
  defineComponent,
  getComponentValue,
  setComponent,
} from '@mud-classic/recs';

import { GodID } from './workers/workers';
import { SetupContractConfig, setupMUDNetwork } from "layers/network/setup";
import { SystemAbis } from 'types/SystemAbis.mjs';
import { SystemTypes } from 'types/SystemTypes';
import { createActionSystem } from './systems/ActionSystem/createActionSystem';
import { createNotificationSystem } from './systems/NotificationSystem/createNotificationSystem';
import { createAdminAPI } from './api/admin';
import { createPlayerAPI } from './api/player';
import { setUpWorldAPI } from './api/world';
import { createComponents } from './components/register';
import { initExplorer } from './explorer';

export async function createNetworkLayer(config: SetupContractConfig) {
  const world = createWorld();
  const components = createComponents(world);

  const { txQueue, systems, txReduced$, network, startSync } = await setupMUDNetwork<
    typeof components,
    SystemTypes
  >(config, world, components, SystemAbis, {
    fetchSystemCalls: true,
  });

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
    setComponent(NetworkUpdater, godEntityIndex, { value: nextVal });
  };

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
      world: setUpWorldAPI(systems, provider),
    },
    updates: {
      components: {
        Network: NetworkUpdater,
      },
      functions: {
        UpdateNetwork,
      },
    },
    explorer: {} as any,
  };

  initExplorer(networkLayer);
  return networkLayer;
}
