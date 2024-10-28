import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner, queryAccountsByRoom } from 'network/shapes/Account';
import { queryNodeKamis } from 'network/shapes/Node';
import { Room, getAllRooms, getRoomByIndex } from 'network/shapes/Room';
import { Grid } from './Grid';

export function registerMapModal() {
  registerUIComponent(
    'MapModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
            utils: {
              queryNodeKamis: (nodeIndex: number) => queryNodeKamis(world, components, nodeIndex),
              queryAccountsByRoom: (roomIndex: number) =>
                queryAccountsByRoom(components, roomIndex),
            },
          };
        })
      ),

    // Render
    ({ network, data, utils }) => {
      const { account } = data;
      const { actions, api, components, world } = network;
      const { queryNodeKamis, queryAccountsByRoom } = utils;
      const { roomIndex, setRoom: setRoomIndex } = useSelected();
      const { modals } = useVisibility();

      const [hoveredRoom, setHoveredRoom] = useState(0);
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
      const [zone, setZone] = useState(0);

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setRoomIndex(account.roomIndex);
      }, [modals.map]);

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
        >
          <Grid
            index={roomIndex}
            zone={zone}
            rooms={roomMap}
            actions={{ move }}
            utils={{ setHoveredRoom, queryNodeKamis, queryAccountsByRoom }}
          />
        </ModalWrapper>
      );
    }
  );
}
