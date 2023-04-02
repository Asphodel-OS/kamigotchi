import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room1 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room001() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room001', room1);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room001')
        .setScale(scale * 8.3);
    },
  };
}
