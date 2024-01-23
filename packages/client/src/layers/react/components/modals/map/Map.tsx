import React, { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { RoomInfo } from './RoomInfo';
import { mapIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { Room, getRoomByLocation } from 'layers/network/shapes/Room';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';


export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 8,
      rowEnd: 50,
    },
    (layers) => {
      const { network } = layers;
      const {
        api: { player },
        components: { Location, OperatorAddress },
        actions,
      } = network;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            network,
            data: { account }
          };
        })
      );
    },
    ({ network, data }) => {
      const { actions, api } = network;

      // console.log('mRoom: ', data)
      const { roomLocation, setRoom } = useSelected();
      const { modals } = useVisibility();
      const [selectedRoom, setSelectedRoom] = useState<Room>();
      const [selectedExits, setSelectedExits] = useState<Room[]>([]);


      /////////////////
      // DATA FETCHING

      // set selected room location to the player's current one when map modal is opened
      useEffect(() => {
        if (modals.map) setRoom(data.account.location)
      }, [modals.map]);

      // update the selected room details
      useEffect(() => {
        if (roomLocation) {
          const roomObject = getRoomByLocation(network, roomLocation, { players: true });
          setSelectedRoom(roomObject);

          const exits = (roomObject.exits)
            ? roomObject.exits.map((exit) => getRoomByLocation(network, exit))
            : [];
          setSelectedExits(exits);
        }
      }, [roomLocation, data.account]);


      ///////////////////
      // ACTIONS

      const move = (location: number) => {
        const room = getRoomByLocation(network, location);
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'AccountMove',
          params: [location],
          description: `Moving to ${room.name}`,
          execute: async () => {
            return api.player.account.move(location);
          },
        });
      };

      const handleClick = (location: number) => {
        playClick();
        move(location);
      }

      const ExitsDisplay = () => {
        return (
          <Section>
            <Title>Go To..</Title>
            {selectedExits.map((exit) => {
              return (
                <ClickableDescription key={exit.location} onClick={() => handleClick(exit.location)}>
                  → {exit.name}
                </ClickableDescription>
              );
            })}
          </Section>
        );
      }


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
  padding-bottom: .5vw;

  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: .3vw;
  
  font-size: .8vw;
  font-family: Pixel;
  text-align: left;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;