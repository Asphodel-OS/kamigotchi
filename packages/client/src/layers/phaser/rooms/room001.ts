import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room001image from 'assets/images/rooms/1_mistyriver.png';

const { scale } = resizePicture();

export function room001() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room001', room001image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room001')
        .setScale(scale * 8.3);
    },
  };
}
