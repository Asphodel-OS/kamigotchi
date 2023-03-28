import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room010image from 'assets/images/rooms/10_insectforest.png';

const { scale } = resizePicture();

export function room010() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room010', room010image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room010')
        .setScale(scale * 8.3);
    },
  };
}
