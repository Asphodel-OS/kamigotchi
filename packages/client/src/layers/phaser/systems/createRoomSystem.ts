/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineSystem, Has, HasValue, runQuery } from '@latticexyz/recs';
import { roomExits } from '../../../constants';
import { NetworkLayer } from '../../network/types';
import { dataStore } from '../../react/store/createStore';
import { PhaserLayer, PhaserScene } from '../types';
import { getCurrentRoom } from '../utils';

export function createRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    network: { connectedAddress },
    world,
    components: { Location, PlayerAddress },
  } = network;

  const {
    game: {
      scene: {
        keys: { Main },
      },
    },
  } = phaser;

  const myMain = Main as PhaserScene;

  defineSystem(world, [Has(PlayerAddress), Has(Location)], async (update) => {
    const characterEntityNumber = Array.from(
      runQuery([HasValue(PlayerAddress, { value: connectedAddress.get() })])
    )[0];

    if (characterEntityNumber == update.entity) {
      const currentRoom = getCurrentRoom(Location, update.entity);

      dataStore.setState({ roomExits: roomExits[currentRoom]  });

      myMain.interactiveObjects.forEach((object: any) => {
        try {
          object.removeInteractive();
          object.removeFromDisplayList();
        } catch (e) {
          // Ignore objects that have already had their interactivity removed
        }
      });
      myMain.interactiveObjects = [];

      myMain.rooms![currentRoom].create(myMain);
    }
  });
}
