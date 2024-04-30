import { defineScaleConfig, defineScene } from '@mud-classic/phaserx';
import { GameScene } from './scenes/GameScene';

export type PhaserConfig = {
  parent: string;
  pixelArt: boolean;
  physics: {
    default: string;
    arcade: {
      debug: boolean;
    };
  };
  scene: [ReturnType<typeof defineScene>];
  title: string;
  scale: ReturnType<typeof defineScaleConfig>;
};

export const phaserConfig: PhaserConfig = {
  parent: 'phaser-game',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  pixelArt: true,
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
  title: 'Kamigotchi',
};
