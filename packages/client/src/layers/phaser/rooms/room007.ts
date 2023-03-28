import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room007image from 'assets/images/rooms/7_lobby.png';

const { scale } = resizePicture();

export function room007() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room007', room007image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room007')
        .setScale(scale * 8.3);
    },
  };
}
