import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room003image from 'assets/images/rooms/room3.png';

const { scale } = resizePicture();

export function room003() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room003', room003image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room003')
        .setScale(scale * 8.3);
    },
  };
}
