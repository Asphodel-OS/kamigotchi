import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room10 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room010() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room010', room10);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room010')
        .setScale(scale * 8.3);
    },
  };
}
