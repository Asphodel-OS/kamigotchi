import React, { useEffect, useMemo } from 'react';
import { map, merge } from 'rxjs';
import { registerUIComponent } from '../engine/store';
import styled from 'styled-components';
import { dataStore } from '../store/createStore';
import './font.css';
import { gridRooms } from '../../../constants';
import clickSound from '../../../public/sound/sound_effects/mouseclick.wav';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';
import { getCurrentRoom } from '../../phaser/utils';
import { ModalWrapper } from './styled/AnimModalWrapper';

const objectKeys = Object.keys(gridRooms);

export function registerWorldMap() {
  registerUIComponent(
    'WorldMap',
    {
      colStart: 70,
      colEnd: 100,
      rowStart: 1,
      rowEnd: 40,
    },
    (layers) => {
      const {
        network: {
          api: { player },
          network: { connectedAddress },
          components: { IsAccount, Location, PlayerAddress },
          actions,
        },
      } = layers;

      return merge(Location.update$, PlayerAddress.update$).pipe(
        map(() => {
          // get the account entity of the controlling wallet
          const accountEntityIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(PlayerAddress, {
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
        visibleDivs,
        setVisibleDivs,
        sound: { volume },
        roomExits: { down, up },
      } = dataStore();

      useEffect(() => {
        if (visibleDivs.worldMap === true)
          document.getElementById('world_map')!.style.display = 'block';
      }, [visibleDivs.worldMap]);

      ///////////////////
      // ACTTONS

      const changeRoom = (side: number) => {
        const clickFX = new Audio(clickSound);

        clickFX.volume = volume;
        clickFX.play();

        const actionID = `Moving...` as EntityID;

        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.account.move(side);
          },
        });
      };

      ///////////////////
      // DISPLAY

      // toggles the visibility of the modal
      const toggleModal = () => {
        setVisibleDivs({
          ...visibleDivs,
          worldMap: !visibleDivs.worldMap,
        });
      };

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

      // <ModalWrapper id="world_map">
      return (
        <ModalWrapper id="world_map" isOpen={visibleDivs.worldMap}>
          <ModalContent>
            <TopButton style={{ pointerEvents: 'auto' }} onClick={toggleModal}>
              X
            </TopButton>
            {RoomGrid}
          </ModalContent>
          <ButtonWrapper>
            <Button
              style={{
                pointerEvents: 'auto',
                display: up === 0 ? 'none' : 'inline-block',
              }}
              onClick={() => {
                changeRoom(up);
              }}
            >
              ↑
            </Button>
            <Button
              style={{
                pointerEvents: 'auto',
                display: down === 0 ? 'none' : 'inline-block',
              }}
              onClick={() => {
                changeRoom(down);
              }}
            >
              ↓
            </Button>
          </ButtonWrapper>
        </ModalWrapper>
      );
    }
  );
}

const ModalContent = styled.div`
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

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  text-align: center;
  text-decoration: none;
  font-size: 29px;
  cursor: pointer;
  width: 10%;
  border-radius: 5px;
  position: static;
  font-family: Pixel;

  &:active {
    background-color: #c2c2c2;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-right: 5%;
`;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  grid-column: 1;
  grid-row: 1;
  width: 30px;
  &:active {
    background-color: #c2c2c2;
  }
  justify-self: right;
`;
