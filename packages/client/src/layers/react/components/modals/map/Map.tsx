import { EntityID } from '@latticexyz/recs';
import crypto from 'crypto';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { mapIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Room, getAllRooms, queryRoomsX } from 'layers/network/shapes/Room';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected } from 'layers/react/store/selected';
import { useVisibility } from 'layers/react/store/visibility';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';
import { Grid } from './Grid';
import { RoomInfo } from './RoomInfo';

export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 75,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const account = getAccountFromBurner(layers.network);
          return {
            network: layers.network,
            data: { account },
          };
        })
      ),

    // Render
    ({ network, data }) => {
      // console.log('mRoom: ', data)
      const { actions, api } = network;
      const { roomIndex, setRoom } = useSelected();
      const { modals } = useVisibility();
      const [selectedRoom, setSelectedRoom] = useState<Room>();
      const [roomMap, setRoomMap] = useState<Map<number, Room>>(new Map());
      const [selectedExits, setSelectedExits] = useState<Room[]>([]);

      /////////////////
      // DATA FETCHING

      // set selected room roomIndex to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setRoom(data.account.roomIndex);
      }, [modals.map]);

      // update the selected room details
      useEffect(() => {
        if (roomIndex) {
          const roomArr = queryRoomsX(
            network,
            { index: roomIndex },
            { exits: true, players: true }
          );
          if (roomArr.length == 0) {
            console.warn('no room found');
            return;
          }

          const roomObject = roomArr[0];
          setSelectedRoom(roomObject);

          const exits = roomObject.exits ? roomObject.exits : [];
          setSelectedExits(exits);
        }
      }, [roomIndex, data.account]);

      // query the set of rooms whenever the current z-level changes
      useEffect(() => {
        const roomMap = new Map<number, Room>();
        const queriedRooms = getAllRooms(network, { exits: true });
        for (const room of queriedRooms) {
          roomMap.set(room.index, room);
        }
        setRoomMap(roomMap);
      }, [selectedRoom?.location.z]);

      ///////////////////
      // ACTIONS

      const move = (targetRoom: number) => {
        const room = queryRoomsX(network, { index: targetRoom })[0];
        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountMove',
          params: [targetRoom],
          description: `Moving to ${room.name}`,
          execute: async () => {
            return api.player.account.move(targetRoom);
          },
        });
      };

      const handleClick = (targetRoom: number) => {
        playClick();
        move(targetRoom);
      };

      const ExitsDisplay = () => {
        return (
          <Section>
            <Title>Go To..</Title>
            {selectedExits.map((exit) => {
              return (
                <ClickableDescription key={exit.index} onClick={() => handleClick(exit.index)}>
                  → {exit.name}
                </ClickableDescription>
              );
            })}
          </Section>
        );
      };

      ///////////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='world_map'
          divName='map'
          header={<ModalHeader title={selectedRoom?.name ?? 'Map'} icon={mapIcon} />}
          footer={<ExitsDisplay />}
          canExit
        >
          <Grid roomIndex={roomIndex} rooms={roomMap} actions={{ move }} />
          <RoomInfo room={selectedRoom} />
        </ModalWrapper>
      );
    }
  );
}

const Section = styled.div`
  margin: 1.2vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const Title = styled.p`
  color: #333;
  padding-bottom: 0.5vw;

  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: 0.3vw;

  font-size: 0.8vw;
  font-family: Pixel;
  text-align: left;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
