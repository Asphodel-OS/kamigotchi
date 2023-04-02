import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room5 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room005() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room005', room5);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room005')
        .setScale(scale * 8.3);
    },
  };
}
