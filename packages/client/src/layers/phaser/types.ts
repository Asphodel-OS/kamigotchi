import { defineScaleConfig, defineScene } from '@latticexyz/phaserx';
import { createPhaserLayer } from './createPhaserLayer';

export type TPhaserConfig = {
  parent: string;
  pixelArt: boolean;
  physics: {
    default: string;
    arcade: {
      debug: boolean;
      gravity: {
        y: number;
      };
    };
  };
  scene: [ReturnType<typeof defineScene>];
  title: string;
  scale: ReturnType<typeof defineScaleConfig>;
};

export type PhaserLayer = Awaited<ReturnType<typeof createPhaserLayer>>;