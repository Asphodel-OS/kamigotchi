/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineSystem, Has, HasValue, runQuery } from '@latticexyz/recs';

import { rooms } from 'src/constants';
import { NetworkLayer } from 'layers/network/types';
import { PhaserLayer } from 'layers/phaser/types';
import { closeModalsOnRoomChange, getCurrentRoom } from 'layers/phaser/utils';
import { GameScene } from 'layers/phaser/scenes/GameScene';
import { checkDuplicateRooms } from '../utils/checkDuplicateRooms';

export function changeRoomSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    network: { connectedAddress },
    world,
    components: { IsAccount, Location, OperatorAddress },
  } = network;

  const {
    game: {
      scene: {
        keys: { Game },
      },
    },
  } = phaser;

  const GameSceneInstance = Game as GameScene;

  defineSystem(world, [Has(OperatorAddress), Has(Location)], async (update) => {
    const accountIndex = Array.from(
      runQuery([HasValue(OperatorAddress, { value: connectedAddress.get() }), Has(IsAccount)])
    )[0];

    if (accountIndex == update.entity) {
      const currentRoom = getCurrentRoom(Location, update.entity);
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
