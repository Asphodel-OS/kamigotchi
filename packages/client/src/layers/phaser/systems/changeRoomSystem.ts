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

// TODO: consolidate this logic with the changeRoom function
export function changeRoomSystem(network: NetworkLayer, game: Phaser.Scene) {
  const scene = game as GameScene;
  const {
    world,
    components: { IsAccount, RoomIndex, OwnerAddress, OperatorAddress },
    network: { connectedAddress },
  } = network;

  const system = async (update: any) => {
    const { setRoom } = useSelected.getState();

    // query for the account of the connected burner address
    const accountIndices = runQuery([
      Has(IsAccount),
      HasValue(OperatorAddress, { value: connectedAddress.get() }),
    ]);
    const accountIndex = Array.from(accountIndices)[0];

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

  return defineRxSystem(
    world,
    defineQuery([Has(RoomIndex), Has(OperatorAddress), Has(OwnerAddress)]).update$,
    system
  );
}

export function changeRoom(network: NetworkLayer, game: Phaser.Scene) {
  const scene = game as GameScene;
  const {
    components: { IsAccount, RoomIndex, OperatorAddress },
    network: { connectedAddress },
  } = network;

  const { setRoom } = useSelected.getState();

  // query for the account of the connected burner address
  const accountIndices = runQuery([
    Has(IsAccount),
    HasValue(OperatorAddress, { value: connectedAddress.get() }),
  ]);
  const accountIndex = Array.from(accountIndices)[0];

  // get the current room and update the selected entity store
  const currentRoom = (getComponentValue(RoomIndex, accountIndex)?.value as number) * 1;
  setRoom(currentRoom);

  // update the Phaser scene with the new room
  scene.room = rooms[currentRoom];
  if (!checkDuplicateRooms(currentRoom, scene.prevRoom)) {
    scene.sound.removeAll();
  }
  scene.scene.restart();
  scene.currentRoom = currentRoom;
  closeModalsOnRoomChange();
}

export const closeModalsOnRoomChange = () => {
  const { modals } = useVisibility.getState();

  useVisibility.setState({
    modals: {
      ...modals,
      bridgeERC20: false,
      bridgeERC721: false,
      buy: false,
      dialogue: false,
      gacha: false,
      leaderboard: false,
      lootboxes: false,
      merchant: false,
      nameKami: false,
      node: false,
      operatorFund: false,
    },
  });
};
