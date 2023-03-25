import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import room004image from 'assets/images/rooms/room4.png';
import { getGirlCoordinates } from '../utils/coordinates';
import { triggerObjectModal } from '../utils/triggerObjectModal';

const { scale, diff } = resizePicture();

export function room004() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room004', room004image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room004')
        .setScale(scale * 8.3);

      const girlCoordinates = getGirlCoordinates(scale);

      const girl = scene.add.rectangle(
        girlCoordinates.x - diff.widthDiff,
        girlCoordinates.y - diff.heightDiff,
        girlCoordinates.width - diff.widthDiff / 4,
        girlCoordinates.height - diff.heightDiff / 4,
      );

      scene.interactiveObjects.push(
        triggerObjectModal(girl, 'Buy something or get out.')
      );
    },
  };
}
