import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room011image from 'assets/images/rooms/11_temple.png';

const { scale } = resizePicture();

export function room011() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room011', room011image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room011')
        .setScale(scale * 8.3);
    },
  };
}
