import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Room, getAllRooms } from 'layers/network/shapes/Room';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected, useVisibility } from 'layers/react/store';
import { Exits } from './Exits';
import { Grid } from './Grid';
import { Players } from './Players';
import { RoomInfo } from './RoomInfo';

export function registerMapModal() {
  registerUIComponent(
    'MapModal',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 60,
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
      // console.log('mRoom: ', data)
      const { actions, api, components, world } = network;
      const { roomIndex: selectedRoom, setRoom: setSelectedRoom } = useSelected();
      const { modals } = useVisibility();
      const [hoveredRoom, setHoveredRoom] = useState(0);
      const [displayedRoom, setDisplayedRoom] = useState(0);
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setSelectedRoom(data.account.roomIndex);
      }, [modals.map]);

      // query the set of rooms whenever the selected room changes
      useEffect(() => {
        const roomMap = new Map<number, Room>();
        const queriedRooms = getAllRooms(world, components, { players: true, exits: true });
        for (const room of queriedRooms) {
          roomMap.set(room.index, room);
        }
        setRoomMap(roomMap);
      }, [selectedRoom]);

      // set the displayed room based on the selected and hovered
      useEffect(() => {
        if (hoveredRoom) setDisplayedRoom(hoveredRoom);
        else setDisplayedRoom(selectedRoom);
      }, [hoveredRoom, selectedRoom]);

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
          id='world_map'
          divName='map'
          header={<ModalHeader title={roomMap.get(selectedRoom)?.name ?? 'Map'} icon={mapIcon} />}
          footer={<Players index={displayedRoom} rooms={roomMap} />}
          canExit
        >
          <Container>
            <Column>
              <Grid index={selectedRoom} rooms={roomMap} actions={{ move, setHoveredRoom }} />
            </Column>
            <Column>
              <RoomInfo index={displayedRoom} rooms={roomMap} />
              <Exits index={displayedRoom} rooms={roomMap} actions={{ move }} />
            </Column>
          </Container>
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  padding: 1vw;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
