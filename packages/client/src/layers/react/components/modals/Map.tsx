import React, { useEffect, useMemo } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';

import { getCurrentRoom } from 'layers/phaser/utils';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import { gridRooms } from '../../../../constants';

const objectKeys = Object.keys(gridRooms);

export function registerMapModal() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 70,
      colEnd: 100,
      rowStart: 20,
      rowEnd: 60,
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

          const currentRoom = getCurrentRoom(Location, accountEntityIndex);
          return {
            actions,
            api: player,
            data: { currentRoom },
          };
        })
      );
    },
    ({ actions, api, data }) => {
      const {
        visibleModals,
        roomExits: { down, up },
      } = dataStore();

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

      ///////////////////
      // DISPLAY

      // generate the grid of rooms
      const RoomGrid = useMemo(() => {
        const result = [];
        for (let i = 1; i <= 100; i++) {
          const roomStyle: any = { borderRadius: '0', border: '0' };
          if (objectKeys.includes(i.toString())) {
            if (gridRooms[i].available === false) {
              roomStyle.backgroundColor = 'gray';
            } else if (data.currentRoom === gridRooms[i].room) {
              roomStyle.backgroundColor = 'green';
            } else {
              roomStyle.backgroundColor = 'yellow';
            }
          }

          result.push(<Room key={`room_${i}`} style={roomStyle} />);
        }
        return result;
      }, [objectKeys, data.currentRoom]);

      return (
        <ModalWrapperFull id='world_map' divName='map'>
          <GridWrapper>
            <LoadBearingDiv>X</LoadBearingDiv>
            {RoomGrid}
          </GridWrapper>
          <ButtonWrapper>
            <ActionButton
              id='button-up'
              disabled={up === 0}
              onClick={() => move(up)}
              size='medium'
            >
              ↑
            </ActionButton>
            <ActionButton
              id='button-down'
              disabled={down === 0}
              onClick={() => move(down)}
              size='medium'
            >
              ↓
            </ActionButton>
          </ButtonWrapper>
        </ModalWrapperFull>
      );
    }
  );
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 5%;
`;

const GridWrapper = styled.div`
  display: grid;
  background-color: white;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-gap: 4px;
  padding: 8px;
  width: 70%;
  height: 80%;
`;

const Room = styled.div`
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 4px;
  border: 2px solid black;
  transition: background-color 0.2s ease-in-out;
`;

const LoadBearingDiv = styled.button`
  visibility: hidden;
  padding: 10px;
  font-size: 14px;
  width: 10px;
`;
