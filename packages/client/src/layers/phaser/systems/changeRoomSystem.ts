import {
  defineRxSystem,
  defineQuery,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';
import { merge } from 'rxjs';

import { rooms } from 'constants/rooms';
import { NetworkLayer } from 'layers/network/types';
import { GameScene } from 'layers/phaser/scenes/GameScene';
import { PhaserLayer } from 'layers/phaser/types';
import { checkDuplicateRooms } from 'layers/phaser/utils/rooms';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';

export function changeRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { IsAccount, RoomIndex, OwnerAddress, OperatorAddress },
    network: { connectedAddress },
    updates: {
      components: { Network },
    },
  } = network;

  const {
    game: {
      scene: {
        keys: { Game },
      },
    },
  } = phaser;

  const GameSceneInstance = Game as GameScene;

  const system = async (update: any) => {
    const { setRoom } = useSelected.getState();

    // TODO: update this (and everything) to operate off of the selected Connector address
    const accountIndex = Array.from(
      runQuery([
        Has(IsAccount),
        HasValue(OperatorAddress, { value: connectedAddress.get() }),
      ])
    )[0];

    if (accountIndex == update.entity || 0 == update.entity) {
      const currentRoom =
        (getComponentValue(RoomIndex, accountIndex)?.value as number) * 1;
      setRoom(currentRoom);

      GameSceneInstance.room = rooms[currentRoom];
      if (!checkDuplicateRooms(currentRoom, GameSceneInstance.prevRoom)) {
        GameSceneInstance.sound.removeAll();
      }
      GameSceneInstance.scene.restart();
      GameSceneInstance.currentRoom = currentRoom;
      closeModalsOnRoomChange();
    }
  };

  defineRxSystem(
    world,
    merge(
      defineQuery([Has(RoomIndex), Has(OperatorAddress), Has(OwnerAddress)])
        .update$,
      Network.update$
    ).pipe(),
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
