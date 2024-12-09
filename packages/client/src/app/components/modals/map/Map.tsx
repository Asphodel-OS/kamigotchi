import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Account, getAccount } from 'app/cache/account';
import { getRoom, getRoomByIndex } from 'app/cache/room';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { mapIcon } from 'assets/images/icons/menu';
import {
  queryAccountFromEmbedded,
  queryAccountKamis,
  queryRoomAccounts,
} from 'network/shapes/Account';
import { Condition, passesConditions } from 'network/shapes/Conditional';
import { getBaseKami, getKamiLocation } from 'network/shapes/Kami';
import { queryNodeByIndex, queryNodeKamis } from 'network/shapes/Node';
import { queryRoomByIndex, queryRooms, Room } from 'network/shapes/Room';
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
      interval(2000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const roomOptions = { exits: 3600 };

          return {
            network,
            data: {
              accountEntity,
              accountKamis: queryAccountKamis(world, components, accountEntity),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity),
              getRoom: (entity: EntityIndex) => getRoom(world, components, entity, roomOptions),
              getRoomByIndex: (index: number) => getRoomByIndex(world, components, index),
              getRoomIndex: () => getRoomIndex(components, accountEntity),
              getBaseKami: (kamiEntity: EntityIndex) => getBaseKami(world, components, kamiEntity),
              getKamiLocation: (kamiEntity: EntityIndex) =>
                getKamiLocation(world, components, kamiEntity),
              passesConditions: (account: Account, gates: Condition[]) =>
                passesConditions(world, components, gates, account),
              queryAccountKamis: () => queryAccountKamis(world, components, accountEntity),
              queryNodeByIndex: (index: number) => queryNodeByIndex(world, index),
              queryNodeKamis: (nodeEntity: EntityIndex) =>
                queryNodeKamis(world, components, nodeEntity),
              queryAllRooms: () => queryRooms(components),
              queryRoomAccounts: (roomIndex: number) => queryRoomAccounts(components, roomIndex),
              queryRoomByIndex: (index: number) => queryRoomByIndex(components, index),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { queryAllRooms } = utils;
      const { actions, api, components, world } = network;
      const { roomIndex } = useSelected();
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

      // query the set of rooms whenever the zone changes
      // NOTE: roomIndex is controlled by canvas/Scene.tsx
      useEffect(() => {
        const newRoom = getRoomByIndex(world, components, roomIndex);
        if (zone == newRoom.location.z) return;

        const roomMap = new Map<number, Room>();
        const roomEntities = queryAllRooms();
        const rooms = roomEntities.map((entity) => getRoom(world, components, entity));
        for (const room of rooms) {
          if (room.location.z == zone) {
            roomMap.set(room.index, room);
          }
        }
        setZone(zone);
        setRoomMap(roomMap);
      }, [modals.map, roomIndex, lastTick]);

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
            accountKamis={data.accountKamis}
            actions={{ move }}
            utils={{ ...utils, setHoveredRoom }}
          />
        </ModalWrapper>
      );
    }
  );
}
