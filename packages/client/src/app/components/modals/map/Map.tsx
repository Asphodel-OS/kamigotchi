import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { getAccount } from 'app/cache/account';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { mapIcon } from 'assets/images/icons/menu';
import {
  queryAccountFromEmbedded,
  queryAccountKamis,
  queryAccountsByRoom,
} from 'network/shapes/Account';
import { getBaseKami, getKamiLocation } from 'network/shapes/Kami';
import { queryNodeByIndex, queryNodeKamis } from 'network/shapes/Node';
import { getAllRooms, getRoomByIndex, Room } from 'network/shapes/Room';
import { getRoomIndex } from 'network/shapes/utils/component';
import { Grid } from './Grid';

export function registerMapModal() {
  registerUIComponent(
    'MapModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 79,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);

          return {
            network,
            data: {
              accountEntity,
              accountKamis: queryAccountKamis(world, components, accountEntity),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity),
              getRoomIndex: () => getRoomIndex(components, accountEntity),
              getBaseKami: (kamiEntity: EntityIndex) => getBaseKami(world, components, kamiEntity),
              getKamiLocation: (kamiEntity: EntityIndex) =>
                getKamiLocation(world, components, kamiEntity),
              queryAccountsByRoom: (roomIndex: number) =>
                queryAccountsByRoom(components, roomIndex),
              queryAccountKamis: () => queryAccountKamis(world, components, accountEntity),
              queryNodeByIndex: (index: number) => queryNodeByIndex(world, index),
              queryNodeKamis: (nodeEntity: EntityIndex) =>
                queryNodeKamis(world, components, nodeEntity),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { accountEntity, accountKamis } = data;
      const { queryAccountKamis, getRoomIndex } = utils;
      const { actions, api, components, world } = network;
      const { roomIndex, setRoom: setRoomIndex } = useSelected();
      const { modals } = useVisibility();

      const [lastTick, setLastTick] = useState(Date.now());
      const [hoveredRoom, setHoveredRoom] = useState(0);
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
      const [zone, setZone] = useState(0);

      // ticking
      useEffect(() => {
        const updateTick = () => setLastTick(Date.now());
        const timerId = setInterval(updateTick, 1000);
        return () => clearInterval(timerId);
      }, []);

      // set selected room roomIndex to the player's current one
      // skip if modal is closed
      useEffect(() => {
        if (!modals.map) return;
        const accRoomIndex = getRoomIndex();
        if (accRoomIndex != roomIndex) setRoomIndex(accRoomIndex);
      }, [modals.map, accountEntity, lastTick]);

      // query the set of rooms whenever the selected room changes
      useEffect(() => {
        const roomMap = new Map<number, Room>();
        const currRoom = getRoomByIndex(world, components, roomIndex);
        setZone(currRoom.location.z);

        const queriedRooms = getAllRooms(world, components, {
          checkExits: { account: account },
          players: true,
        });

        for (const room of queriedRooms) {
          if (room.location.z == currRoom.location.z) {
            roomMap.set(room.index, room);
          }
        }
        setRoomMap(roomMap);
      }, [roomIndex]);

      ///////////////////
      // ACTIONS

      const move = (index: number) => {
        actions.add({
          action: 'AccountMove',
          params: [index],
          description: `Moving to ${roomMap.get(index)?.name}`,
          execute: async () => {
            return api.player.account.move(index);
          },
        });
      };

      ///////////////////
      // RENDER

      return (
        <ModalWrapper
          id='map'
          header={<ModalHeader title={roomMap.get(roomIndex)?.name ?? 'Map'} icon={mapIcon} />}
          canExit
          noPadding
          truncate
          scrollBarColor='#cbba3d #e1e1b5'
        >
          <Grid
            index={roomIndex}
            zone={zone}
            rooms={roomMap}
            accountKamis={accountKamis}
            actions={{ move }}
            utils={{ ...utils, setHoveredRoom }}
          />
        </ModalWrapper>
      );
    }
  );
}
