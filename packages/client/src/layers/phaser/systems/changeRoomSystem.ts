import {
  Has,
  HasValue,
  defineQuery,
  defineRxSystem,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { rooms } from 'constants/rooms';
import { NetworkLayer } from 'layers/network';
import { GameScene } from 'layers/phaser/scenes/GameScene';
import { checkDuplicateRooms } from 'layers/phaser/utils/rooms';
import { useSelected, useVisibility } from 'layers/react/store';

export function changeRoomSystem(network: NetworkLayer, game: Phaser.Scene) {
  const scene = game as GameScene;
  const {
    world,
    components: { IsAccount, RoomIndex, OwnerAddress, OperatorAddress },
    network: { connectedAddress },
  } = network;

  const system = async (update: any) => {
    const { setRoom } = useSelected.getState();

    // TODO: update this (and everything) to operate off of the selected Connector address
    const accountIndex = Array.from(
      runQuery([Has(IsAccount), HasValue(OperatorAddress, { value: connectedAddress.get() })])
    )[0];

    if (accountIndex == update.entity || 0 == update.entity) {
      const currentRoom = (getComponentValue(RoomIndex, accountIndex)?.value as number) * 1;
      setRoom(currentRoom);

      scene.room = rooms[currentRoom];
      if (!checkDuplicateRooms(currentRoom, scene.prevRoom)) {
        scene.sound.removeAll();
      }
      scene.scene.restart();
      scene.currentRoom = currentRoom;
      closeModalsOnRoomChange();
    }
  };

  defineRxSystem(
    world,
    defineQuery([Has(RoomIndex), Has(OperatorAddress), Has(OwnerAddress)]).update$,
    system
  );
}

export const closeModalsOnRoomChange = () => {
  const { modals } = useVisibility.getState();

  useVisibility.setState({
    modals: {
      ...modals,
      dialogue: false,
      merchant: false,
      gacha: false,
      kami: false,
      node: false,
    },
  });
};
