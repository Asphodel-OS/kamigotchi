import { room6 } from 'assets/images/rooms';
import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';

const { scale } = resizePicture();

export function room006() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room006', room6);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room006')
        .setScale(scale * 8.3);
    },
  };
}
