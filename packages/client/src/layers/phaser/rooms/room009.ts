import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room9 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room009() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room009', room9);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room009')
        .setScale(scale * 8.3);
    },
  };
}
