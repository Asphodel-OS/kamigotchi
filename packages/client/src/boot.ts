import { getComponentValue, removeComponent, setComponent } from '@mud-classic/recs';

import { boot as bootReact, mountReact, setLayers } from 'app/boot';
import { Layers, createNetworkConfig, createNetworkLayer } from 'network/';

// boot the whole thing
export async function boot() {
  bootReact();
  mountReact.current(false);
  const layers = await bootGame();
  mountReact.current(true);
  setLayers.current(layers);
}

// boot the game's network layer
async function bootGame() {
  let initialBoot = true;

  const layers = await rebootGame(initialBoot);
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
  console.log('Booting root network config', networkConfig);

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
