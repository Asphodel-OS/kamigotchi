import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room014image from 'assets/images/rooms/14_ceo.png';

const { scale } = resizePicture();

export function room014() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room014', room014image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room014')
        .setScale(scale * 8.3);
    },
  };
}
