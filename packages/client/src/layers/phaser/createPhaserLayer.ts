import { namespaceWorld } from '@mud-classic/recs';
import { phaserConfig, PhaserConfig } from './config';
import CreatePhaserEngine from './engine/PhaserEngine';
import { changeRoomSystem } from './systems/changeRoomSystem';

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(network: any) {
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
  };

  // --- SYSTEMS --------------------------------------------------------------------
  changeRoomSystem(network, context);

  return context;
}
