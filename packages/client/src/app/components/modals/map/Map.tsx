import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { Account, getAccount } from 'app/cache/account';
import { getKami } from 'app/cache/kami';
import { getRoom, getRoomByIndex } from 'app/cache/room';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { MapIcon } from 'assets/images/icons/menu';
import {
  queryAccountFromEmbedded,
  queryAccountKamis,
  queryRoomAccounts,
} from 'network/shapes/Account';
import { Condition, passesConditions } from 'network/shapes/Conditional';
import { getKamiLocation } from 'network/shapes/Kami';
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
          const accountOptions = { live: 2 }; // what other options do we need here?
          const roomOptions = { exits: 3600 };

          return {
            network,
            data: {
              account: getAccount(world, components, accountEntity, accountOptions),
              accountKamis: queryAccountKamis(world, components, accountEntity),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accountOptions),
              getRoom: (entity: EntityIndex) => getRoom(world, components, entity, roomOptions),
              getRoomByIndex: (index: number) => getRoomByIndex(world, components, index),
              getRoomIndex: () => getRoomIndex(components, accountEntity),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, { live: 2, harvest: 10 }),
              getKamiLocation: (entity: EntityIndex) => getKamiLocation(world, components, entity),
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
      const { getRoom, getRoomByIndex, queryAllRooms } = utils;
      const { actions, api } = network;
      const { roomIndex } = useSelected();
      const { modals } = useVisibility();

      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
      const [zone, setZone] = useState(0);

      // query the set of rooms whenever the zone changes
      // NOTE: roomIndex is controlled by canvas/Scene.tsx
      useEffect(() => {
        if (!modals.map) return;
        const newRoom = getRoomByIndex(roomIndex);
        const newZone = newRoom.location.z;
        if (zone == newZone) return;

        const roomMap = new Map<number, Room>();
        const roomEntities = queryAllRooms();
        const rooms = roomEntities.map((entity) => getRoom(entity));
        const filteredRooms = rooms.filter((room) => room.location.z == newZone);
        filteredRooms.forEach((r) => roomMap.set(r.index, r));

        setZone(newZone);
        setRoomMap(roomMap);
      }, [modals.map, roomIndex]);

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
          header={<ModalHeader title={roomMap.get(roomIndex)?.name ?? 'Map'} icon={MapIcon} />}
          canExit
          noPadding
          truncate
          scrollBarColor='#cbba3d #e1e1b5'
        >
          <Grid
            data={{
              ...data,
              roomIndex,
              zone,
              rooms: roomMap,
            }}
            actions={{ move }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
