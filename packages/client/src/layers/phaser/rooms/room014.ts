import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room14 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room014() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room014', room14);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room014')
        .setScale(scale * 8.3);
    },
  };
}
