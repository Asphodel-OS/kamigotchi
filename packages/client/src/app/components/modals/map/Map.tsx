import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import { getNodeByIndex } from 'network/shapes/Node';
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
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      const { actions, api, components, world } = network;
      const { roomIndex: selectedRoom, setRoom: setSelectedRoom } = useSelected();
      const { modals } = useVisibility();

      const [hoveredRoom, setHoveredRoom] = useState(0);
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
      const [zone, setZone] = useState(0);
      const getNode = (roomIndex: number) => {
        return getNodeByIndex(world, components, roomIndex);
      };

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setSelectedRoom(data.account.roomIndex);
      }, [modals.map]);

      // query the set of rooms whenever the selected room changes
      useEffect(() => {
        const roomMap = new Map<number, Room>();
        const currRoom = getRoomByIndex(world, components, selectedRoom);
        setZone(currRoom.location.z);

        const queriedRooms = getAllRooms(world, components, {
          checkExits: { account: data.account },
          players: true,
        });

        for (const room of queriedRooms) {
          if (room.location.z == currRoom.location.z) {
            roomMap.set(room.index, room);
          }
        }
        setRoomMap(roomMap);
      }, [selectedRoom]);

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
          header={<ModalHeader title={roomMap.get(selectedRoom)?.name ?? 'Map'} icon={mapIcon} />}
          canExit
          noPadding
          truncate
        >
          <Grid
            index={selectedRoom}
            zone={zone}
            rooms={roomMap}
            actions={{ move, setHoveredRoom }}
            utils={{ getNode }}
          />
        </ModalWrapper>
      );
    }
  );
}
