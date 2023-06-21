import React, { useEffect, useRef } from 'react';
import { map, merge } from 'rxjs';
import { EntityID, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';
import styled from 'styled-components';

import { getCurrentRoom } from 'layers/phaser/utils';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import MapGrid from '../library/MapGrid';
import { Room, getRoom } from '../shapes/Room';

export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 33,
      colEnd: 69,
      rowStart: 30,
      rowEnd: 99,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          network: { connectedAddress },
          components: { IsAccount, Location, OperatorAddress },
          actions,
        },
      } = layers;

      return merge(Location.update$, OperatorAddress.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: connectedAddress.get(),
              }),
            ])
          )[0];

          const roomEntityIndex = Array.from(
            runQuery([
              Has(Location),
              HasValue(Location, { value: getComponentValue(Location, accountEntityIndex)?.value }),
            ])
          )[0];

          const roomData = getRoom(layers, roomEntityIndex);
          const currentRoom = getCurrentRoom(Location, accountEntityIndex);
          return {
            actions,
            api: player,
            data: { currentRoom, roomData },
          };
        })
      );
    },
    ({ actions, api, data }) => {
      const { visibleModals } = dataStore();

      useEffect(() => {
        if (visibleModals.map === true)
          document.getElementById('world_map')!.style.display = 'block';
      }, [visibleModals.map]);

      ///////////////////
      // ACTTONS

      const move = (location: number) => {
        const actionID = `Moving to room ${location}` as EntityID;

        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.move(location);
          },
        });
      };

      const RoomInfo = ({ roomData }: { roomData: Room }) => {
        return (
          <Scrollable ref={scrollableRef}>
            <RoomName>
              Room Name: {roomData.name} ({roomData.location})
            </RoomName>
            <Description>
              This is where short descriptive text on the room goes. Brave tester, you have caught
              me doing UX design in prod.
            </Description>
            <Description>Room Owner: None</Description>
            <Description>
              Exits:{' '}
              {roomData.exits?.map((room) => (
                <StyledSpan>{room * 1}</StyledSpan>
              ))}
            </Description>
            <Description>
              You see [array of all operator names in room separated by commas] here
            </Description>
          </Scrollable>
        );
      };

      ///////////////////
      // DISPLAY
      const scrollableRef = useRef<HTMLDivElement>(null);

      return (
        <ModalWrapperFull id='world_map' divName='map'>
          <div style={{ display: 'grid', height: '100%' }}>
            <RoomInfo roomData={data.roomData} />
            <MapBox>
              <MapGrid highlightedRoom={data.currentRoom} move={move} />
            </MapBox>
          </div>
        </ModalWrapperFull>
      );
    }
  );
}

const RoomName = styled.p`
  font-size: 16px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 5px;
`;

const Description = styled.p`
  font-size: 12px;
  color: #333;
  text-align: left;
  font-family: Pixel;
  margin: 5px;
`;

const MapBox = styled.div`
  border-style: solid;
  border-width: 2px 2px 0px 2px;
  border-color: black;
  grid-column: 1;
  grid-row: 1;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  grid-column: 1;
  grid-row: 2;
`;

const StyledSpan = styled.span`
  font-size: 12px;
  color: #333;
  font-family: Pixel;
  margin-left: 7px;
`;
