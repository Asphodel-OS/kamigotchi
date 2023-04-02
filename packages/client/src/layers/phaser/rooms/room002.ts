import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room2 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room002() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room002', room2);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room002')
        .setScale(scale * 8.3);
    },
  };
}
