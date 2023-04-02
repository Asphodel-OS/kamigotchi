import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room7 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room007() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room007', room7);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room007')
        .setScale(scale * 8.3);
    },
  };
}
