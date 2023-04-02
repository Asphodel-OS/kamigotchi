import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room3 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room003() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room003', room3);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room003')
        .setScale(scale * 8.3);
    },
  };
}
