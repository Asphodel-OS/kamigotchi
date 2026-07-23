import ReactDOM from 'react-dom/client';

import { getComponentValue, removeComponent, setComponent } from 'engine/recs';

import { boot as bootReact, mountReact, setLayers } from 'app/boot';
// direct file import: keeps the maintenance bundle free of the boot barrel's
// LoadingState dependency graph (caches, network hooks)
import { MaintenanceScreen } from 'app/components/boot/MaintenanceScreen';
import { DefaultChain } from 'constants/chains';
import { Layers, createNetworkConfig, createNetworkLayer } from 'network/';

// Hard maintenance wall for prod deploy ceremonies. Checked before anything
// else boots: when on, the network layer (RPC, kamigaze, wallet) never
// initializes, so users cannot transact against a half-migrated world.
// Takes precedence over VITE_STATE=DISABLED (soft season-over screen in
// LoadingState, which still boots infra). Build-time flag: toggling it is a
// redeploy each way.
const MAINTENANCE = import.meta.env.VITE_MAINTENANCE === 'true';

// boot the whole thing
export async function boot() {
  if (MAINTENANCE) {
    const rootElement = document.getElementById('react-root');
    if (!rootElement) return console.warn('React root not found');
    ReactDOM.createRoot(rootElement).render(<MaintenanceScreen />);
    return;
  }

  bootReact();
  mountReact.current(false);
  const layers = await bootGame();
  mountReact.current(true);
  setLayers.current(layers);
}

// boot the game's network layer
async function bootGame() {
  const mode = import.meta.env.MODE;
  console.log(`Booting in { ${mode} } mode (chain ${DefaultChain.id}).`);

  const layers = await rebootGame(true);
  (window as any).network = layers.network;

  const ecs = {
    setComponent,
    removeComponent,
    getComponentValue,
  };
  (window as any).ecs = ecs;

  console.log('BOOTED');
  return layers;
}

// Reboot the game
async function rebootGame(initialBoot: boolean): Promise<Layers> {
  const layers: Partial<Layers> = {};

  // Set the game config
  const networkConfig = createNetworkConfig();
  if (!networkConfig) throw new Error('Invalid config');
  else console.log('Root Network Config', networkConfig);

  // Populate the layers
  if (!layers.network) layers.network = await createNetworkLayer(networkConfig);

  // we need to do something about this to actually hold onto existing indexed data
  // we also need this specifically waited upon for proper data subscriptions and wallet flow
  if (initialBoot) {
    initialBoot = false;
    layers.network.startSync();
  }

  return layers as Layers;
}
