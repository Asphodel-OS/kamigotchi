import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { room12 } from 'assets/images/rooms';

const { scale } = resizePicture();

export function room012() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room012', room12);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room012')
        .setScale(scale * 8.3);
    },
  };
}
