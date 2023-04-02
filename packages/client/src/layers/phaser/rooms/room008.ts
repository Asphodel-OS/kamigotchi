import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room8 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room008() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room008', room8);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room008')
        .setScale(scale * 8.3);
    },
  };
}
