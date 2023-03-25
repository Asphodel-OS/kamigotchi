/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineSystem, Has, HasValue, runQuery } from '@latticexyz/recs';
import { roomExits } from '../../../constants';
import { NetworkLayer } from '../../network/types';
import { dataStore } from 'layers/react/store/createStore';
import { PhaserLayer, PhaserScene } from '../types';
import { getCurrentRoom } from '../utils';
import { closeModalsOnRoomChange } from '../utils/closeModalsOnRoomChange';

export function createRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    network: { connectedAddress },
    world,
    components: { Location, OperatorAddress },
  } = network;

  const {
    game: {
      scene: {
        keys: { Main },
      },
    },
  } = phaser;

  const myMain = Main as PhaserScene;

  defineSystem(world, [Has(OperatorAddress), Has(Location)], async (update) => {
    const characterEntityNumber = Array.from(
      runQuery([HasValue(OperatorAddress, { value: connectedAddress.get() })])
    )[0];

    if (characterEntityNumber == update.entity) {
      const currentRoom = getCurrentRoom(Location, update.entity);

      dataStore.setState({ roomExits: roomExits[currentRoom] });

      myMain.interactiveObjects.forEach((object: any) => {
        try {
          object.removeInteractive();
          object.removeFromDisplayList();
        } catch (e) {
          // Ignore objects that have already had their interactivity removed
        }
      });
      myMain.interactiveObjects = [];
      closeModalsOnRoomChange();

      myMain.rooms![currentRoom].create(myMain);
    }
  });
}
