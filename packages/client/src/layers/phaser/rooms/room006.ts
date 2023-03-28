import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room006image from 'assets/images/rooms/6_afront.png';

const { scale } = resizePicture();

export function room006() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room006', room006image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room006')
        .setScale(scale * 8.3);
    },
  };
}
