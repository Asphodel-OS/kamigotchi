import React, { useEffect } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { EntityID } from '@latticexyz/recs';

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { dataStore } from 'layers/react/store/createStore';
import {
  Room,
  getRoomByLocation,
} from 'layers/react/shapes/Room';
import 'layers/react/styles/font.css';

// TODO: update this file and component name to be more desctiptive
export function registerOperatorMovementModal() {
  registerUIComponent(
    'OperatorMovementModal',
    {
      colStart: 20,
      colEnd: 83,
      rowStart: 72,
      rowEnd: 100,
    },
    (layers) => of(layers),
    (layers) => {
      const {
        network: { api, actions },
      } = layers;

      const { selectedEntities, visibleModals, setVisibleModals } = dataStore();
      const [selectedRoom, setSelectedRoom] = React.useState<Room>();

      useEffect(() => {
        if (selectedEntities.room) {
          const room = getRoomByLocation(layers, selectedEntities.room);
          setSelectedRoom(room);
        }
      }, [selectedEntities.room]);


      //////////////////
      // ACTIONS

      const move = () => {
        if (!selectedRoom) return;
        const actionID = `Moving to room ${selectedEntities.room}` as EntityID;

        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            const roomMovment = await api.player.account.move(selectedRoom?.location);
            hideModal();
            return roomMovment;
          },
        });
      };


      //////////////////
      // RENDERING

      const hideModal = () => {
        setVisibleModals({ ...visibleModals, roomMovement: false });
      };

      return (
        <ModalWrapperFull divName='roomMovement' id='roomMovement'>
          <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
            X
          </TopButton>
          <TextWrapper>Do you really wish to move to {selectedRoom?.name}?</TextWrapper>
          <ButtonWrapper>
            <ActionButton
              id='move'
              onClick={() => move()}
              text='Move'
              size='large'
            />
          </ButtonWrapper>
        </ModalWrapperFull>
      );
    }
  );
}

const TextWrapper = styled.div`
  padding: 10px 20px 0px 20px;
  color: #333;
  font-family: Pixel;
  font-size: 24px;
  line-height: 1.5;
  text-align: center;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: center;
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
  width: 30px;
  &:active {
    background-color: #c4c4c4;
  }
  margin: 0px;
`;
