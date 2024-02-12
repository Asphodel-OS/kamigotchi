import { defineScaleConfig, defineScene } from '@latticexyz/phaserx';
import { GameScene } from './scenes/GameScene';

export type PhaserConfig = {
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

export const phaserConfig: PhaserConfig = {
  parent: 'phaser-game',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: [GameScene],
  title: 'Kamigotchi',
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT,
  },
};
