/* eslint-disable prefer-const */
import { createNetworkLayer as createNetworkLayerImport } from './layers/network/createNetworkLayer';
import { createPhaserLayer as createPhaserLayerImport } from './layers/phaser/createPhaserLayer';
import { Layers } from './types';
import {
  getComponentValue,
  removeComponent,
  setComponent,
} from '@latticexyz/recs';
import { Time } from './utils/time';

import { GameConfig } from './layers/network/config';
import { createGameConfig } from './layers/network/createGameConfig';
import { mountReact, setLayers, boot as bootReact } from './layers/react/boot';

let createNetworkLayer = createNetworkLayerImport;
let createPhaserLayer = createPhaserLayerImport;

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

  console.log('booted');
  return { layers, ecs };
}

// Reboot the game 
async function rebootGame(initialBoot: boolean): Promise<Layers> {
  const layers: Partial<Layers> = {};


  // Set the game config
  // const params = new URLSearchParams(window.location.search);
  const gameConfig: GameConfig | undefined = createGameConfig();
  if (!gameConfig) throw new Error('Invalid config');
  console.log("gameConfig", gameConfig);

  // Populate the layers
  if (!layers.network) layers.network = await createNetworkLayer(gameConfig);
  if (!layers.phaser) layers.phaser = await createPhaserLayer(layers.network);

  // what is this for?
  Time.time.setPacemaker((setTimestamp) => {
    layers.phaser?.game.events.on('poststep', (time: number) => {
      setTimestamp(time);
    });
  });

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