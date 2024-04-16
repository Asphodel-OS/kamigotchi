import { namespaceWorld } from '@mud-classic/recs';

import { NetworkLayer } from 'layers/network';
import { phaserConfig, PhaserConfig } from './config';
import CreatePhaserEngine from './engine/PhaserEngine';
import { changeRoom, changeRoomSystem } from './systems/changeRoomSystem';

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, 'phaser');

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {};

  // --- PHASER ENGINE SETUP --------------------------------------------------------

  const {
    game,
    scenes,
    dispose: disposePhaser,
  } = await CreatePhaserEngine(phaserConfig as PhaserConfig);
  world.registerDisposer(disposePhaser);

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    world,
    components,
    network,
    game,
    scenes,
    setChangeRoomSystem: (network: NetworkLayer) => {
      console.log('Setting change room system');
      changeRoomSystem(network, game.scene.keys.Game);
      changeRoom(network, game.scene.keys.Game);
    },
  };

  // --- SYSTEMS --------------------------------------------------------------------
  changeRoomSystem(network, game.scene.keys.Game);

  return context;
}
