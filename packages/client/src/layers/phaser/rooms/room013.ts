import { PhaserScene } from '../types';
import { getGirlCoordinates } from '../utils/coordinates';
import { resizePicture } from '../utils/resizePicture';
import { triggerDialogueModal } from '../utils/triggerDialogueModal';
import room013image from 'assets/images/rooms/13_giftshop.png';

const { scale, diff } = resizePicture();

export function room013() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room013', room013image);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room013')
        .setScale(scale * 8.3);

      const girlCoordinates = getGirlCoordinates(scale);

      const girl = scene.add.rectangle(
        girlCoordinates.x - diff.widthDiff,
        girlCoordinates.y - diff.heightDiff,
        girlCoordinates.width - diff.widthDiff / 4,
        girlCoordinates.height - diff.heightDiff / 4
      );

      scene.interactiveObjects.push(
        triggerDialogueModal(girl, 'Buy something or get out.')
      );
    },
  };
}
