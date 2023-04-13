import { GameScene } from './layers/phaser/scenes/GameScene';

export const phaserConfig = {
  parent: 'phaser-game',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { y: 0 } },
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