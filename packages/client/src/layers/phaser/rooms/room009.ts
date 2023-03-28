import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room009image from 'assets/images/rooms/9_forest.png';

const { scale } = resizePicture();

export function room009() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room009', room009image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room009')
        .setScale(scale * 8.3);
    },
  };
}
