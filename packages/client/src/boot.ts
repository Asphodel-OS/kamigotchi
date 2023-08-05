/* eslint-disable prefer-const */
import {
  getComponentValue,
  removeComponent,
  setComponent,
} from '@latticexyz/recs';

import { createNetworkConfig } from 'layers/network/config';
import { createNetworkLayer } from 'layers/network/createNetworkLayer';
import { createPhaserLayer } from 'layers/phaser/createPhaserLayer';
import { mountReact, setLayers, boot as bootReact } from 'layers/react/boot';
import { Layers } from './types';
import { Time } from './utils/time';

// boot the whole thing
export async function boot() {
  bootReact();
  mountReact.current(false);
  const game = await bootGame();
  mountReact.current(true);
  setLayers.current(game.layers as Layers);
}

// boot the game (phaser and network layers)
// TODO: split this apart and boot the logic over to the network and phaser layers
async function bootGame() {
  let initialBoot = true;

  const layers = await rebootGame(initialBoot);

  const ecs = {
    setComponent,
    removeComponent,
    getComponentValue,
  };

  (window as any).layers = layers;
  (window as any).ecs = ecs;
  (window as any).time = Time.time;

  console.log('BOOTED');
  return { layers, ecs };
}

// Reboot the game 
async function rebootGame(initialBoot: boolean): Promise<Layers> {
  const layers: Partial<Layers> = {};

  // Set the game config
  const networkConfig = createNetworkConfig();
  if (!networkConfig) throw new Error('Invalid config');
  console.log("Booted burner network config", networkConfig);

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