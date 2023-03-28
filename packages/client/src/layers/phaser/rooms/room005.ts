import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room005image from 'assets/images/rooms/5_restricted.png';

const { scale } = resizePicture();

export function room005() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room005', room005image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room005')
        .setScale(scale * 8.3);
    },
  };
}
