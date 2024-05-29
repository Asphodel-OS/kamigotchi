import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/store';
import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Room, getAllRooms } from 'layers/network/shapes/Room';
import { Exits } from './Exits';
import { Grid } from './Grid';
import { Players } from './Players';

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
      const [displayedRoom, setDisplayedRoom] = useState(0);
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setSelectedRoom(data.account.roomIndex);
      }, [modals.map]);

      // query the set of rooms whenever the selected room changes
      useEffect(() => {
        const roomMap = new Map<number, Room>();
        const queriedRooms = getAllRooms(world, components, {
          checkExits: { account: data.account },
          players: true,
        });
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

      const Footer = () => {
        return (
          <FooterRow>
            <Exits index={displayedRoom} rooms={roomMap} actions={{ move }} />
            <Players index={displayedRoom} rooms={roomMap} />
          </FooterRow>
        );
      };

      ///////////////////
      // RENDER

      return (
        <ModalWrapper
          id='map'
          header={<ModalHeader title={roomMap.get(selectedRoom)?.name ?? 'Map'} icon={mapIcon} />}
          // footer={Footer()}
          canExit
          noPadding
        >
          <Container>
            <Row>
              <Grid index={selectedRoom} rooms={roomMap} actions={{ move, setHoveredRoom }} />
            </Row>
            {/* <Row>
              <RoomInfo index={displayedRoom} rooms={roomMap} />
            </Row> */}
          </Container>
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Row = styled.div`
  height: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const FooterRow = styled.div`
  height: 9vw;
  display: flex;
  flex-direction: row;
`;
