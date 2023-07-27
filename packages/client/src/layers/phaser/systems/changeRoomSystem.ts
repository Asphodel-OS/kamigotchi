import {
  defineRxSystem,
  defineQuery,
  getComponentValue,
  Has,
  HasValue,
  runQuery,
  defineUpdateQuery
} from '@latticexyz/recs';
import { map, merge, of } from 'rxjs';
import { makeObservable } from 'mobx';

import { rooms } from 'constants/rooms';
import { NetworkLayer } from 'layers/network/types';
import { GameScene } from 'layers/phaser/scenes/GameScene';
import { PhaserLayer } from 'layers/phaser/types';
import { closeModalsOnRoomChange } from 'layers/phaser/utils';
import { checkDuplicateRooms } from 'layers/phaser/utils/checkDuplicateRooms';
import { useNetworkSettings } from 'layers/react/store/networkSettings';
import { dataStore } from 'layers/react/store/createStore';
import { GodID } from '@latticexyz/network';

export function changeRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { IsAccount, Location, OwnerAddress, OperatorAddress },
    network: { connectedAddress },
    updates: {
      components: { Network },
    }
  } = network;

  const {
    game: { scene: { keys: { Game } } },
  } = phaser;

  const GameSceneInstance = Game as GameScene;

  const system = async (update: any) => {
    const { selectedEntities, setSelectedEntities } = dataStore.getState();
    const { selectedAddress } = useNetworkSettings.getState();
    const accountIndex = Array.from(
      runQuery([
        Has(IsAccount),
        HasValue(OperatorAddress, { value: connectedAddress.get() }),
      ])
    )[0];

    if (accountIndex == update.entity || 0 == update.entity) {
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
  };

  defineRxSystem(
    world,
    merge(defineQuery([Has(OwnerAddress), Has(Location)]).update$, Network.update$).pipe(),
    system
  );
}
