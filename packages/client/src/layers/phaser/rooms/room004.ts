import { PhaserScene } from '../types';
import { resizePicture } from '../utils/resizePicture';
import { getVendMachineCoordinates } from '../utils/coordinates';
import { triggerPetMintModal } from '../utils/triggerPetMintModal';
import { room4 } from 'assets/images/rooms';

const { scale, diff } = resizePicture();

export function room004() {
  return {
    preload: (scene: PhaserScene) => {
      scene.load.image('room004', room4);
    },
    create: (scene: PhaserScene) => {
      scene.add
        .image(window.innerWidth / 2, window.innerHeight / 2, 'room004')
        .setScale(scale * 8.3);

      const vendMachineCoordinates = getVendMachineCoordinates(scale);

      const vend = scene.add.rectangle(
        vendMachineCoordinates.x - diff.widthDiff,
        vendMachineCoordinates.y - diff.heightDiff,
        vendMachineCoordinates.width - diff.widthDiff / 4,
        vendMachineCoordinates.height - diff.heightDiff / 4
      );

      scene.interactiveObjects.push(triggerPetMintModal(vend));
    },
  };
}
