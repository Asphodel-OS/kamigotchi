/* eslint-disable prefer-const */
import { getComponentValue, removeComponent, setComponent } from '@latticexyz/recs';

import { createNetworkConfig, createNetworkLayer } from 'layers/network';
import { createPhaserLayer } from 'layers/phaser/createPhaserLayer';
import { boot as bootReact, mountReact, setLayers } from 'layers/react/boot';
import { Time } from 'utils/time';
import { Layers } from './types';

// boot the whole thing
export async function boot() {
  bootReact();
  mountReact.current(false);
  const layers = await bootGame();
  mountReact.current(true);
  setLayers.current(layers as Layers);
}

// boot the game (phaser and network layers)
// TODO: split this apart and boot the logic over to the network and phaser layers
async function bootGame() {
  let initialBoot = true;

  const layers = await rebootGame(initialBoot);
  (window as any).network = layers.network;
  (window as any).phaser = layers.phaser;

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
  console.log('Booted burner network config', networkConfig);

  // Populate the layers
  if (!layers.network) layers.network = await createNetworkLayer(networkConfig);
  if (!layers.phaser) layers.phaser = await createPhaserLayer(layers.network);

  // Set phaser game tick
  if (layers.phaser) {
    Time.time.setPacemaker((setTimestamp) => {
      layers.phaser!.game.events.on('poststep', (time: number) => {
        setTimestamp(time);
      });
    });
  }

  // Refresh if we detect two canvas elements. Something went wrong.
  if (document.querySelectorAll('#phaser-game canvas').length > 1) {
    console.log('Detected two canvas elements, full reload');
  }

  // we need to do something about this to actually hold onto existing indexed data
  // we also need this specifically waited upon for proper data subscriptions and wallet flow
  if (initialBoot) {
    initialBoot = false;
    layers.network.startSync();
  }

  return layers as Layers;
}
