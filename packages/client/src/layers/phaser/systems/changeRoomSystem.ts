import {
  defineSystem,
  getComponentValue,
  Has,
  HasValue,
  runQuery
} from '@latticexyz/recs';

import { rooms } from 'constants/rooms';
import { NetworkLayer } from 'layers/network/types';
import { GameScene } from 'layers/phaser/scenes/GameScene';
import { PhaserLayer } from 'layers/phaser/types';
import { closeModalsOnRoomChange } from 'layers/phaser/utils';
import { checkDuplicateRooms } from 'layers/phaser/utils/checkDuplicateRooms';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { dataStore } from 'layers/react/store/createStore';

export function changeRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { IsAccount, Location, OwnerAddress },
  } = network;

  const {
    game: { scene: { keys: { Game } } },
  } = phaser;

  const GameSceneInstance = Game as GameScene;

  defineSystem(world, [Has(OwnerAddress), Has(Location)], async (update) => {
    const { selectedEntities, setSelectedEntities } = dataStore.getState();
    const { selectedAddress } = useNetworkSettings.getState();
    const accountIndex = Array.from(
      runQuery([
        Has(IsAccount),
        HasValue(OwnerAddress, { value: selectedAddress }),
      ])
    )[0];

    if (accountIndex == update.entity) {
      const currentRoom = getComponentValue(Location, accountIndex)?.value as number * 1;
      setSelectedEntities({ ...selectedEntities, room: currentRoom });

      GameSceneInstance.room = rooms[currentRoom];
      if (!checkDuplicateRooms(currentRoom, GameSceneInstance.prevRoom)) {
        GameSceneInstance.sound.removeAll();
      }
      GameSceneInstance.scene.restart();
      GameSceneInstance.currentRoom = currentRoom;
      closeModalsOnRoomChange();
    }
  });
}
