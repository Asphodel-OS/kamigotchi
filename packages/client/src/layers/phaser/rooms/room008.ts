import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room008image from 'assets/images/rooms/8_junkshop.png';

const { scale } = resizePicture();

export function room008() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room008', room008image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room008')
        .setScale(scale * 8.3);
    },
  };
}
