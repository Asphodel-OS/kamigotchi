import React from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import styled from 'styled-components';
import 'layers/react/styles/font.css';
import { ModalWrapperFull } from '../library/ModalWrapper';
import { EntityID } from '@latticexyz/recs';

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
      const { selectedRoom, visibleModals, setVisibleModals } = dataStore();
      const hideModal = () => {
        setVisibleModals({ ...visibleModals, roomMovement: false });
      };

      const move = () => {
        const actionID = `Moving to room ${selectedRoom}` as EntityID;

        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            const roomMovment = await api.player.account.move(selectedRoom);
            hideModal();
            return roomMovment;
          },
        });
      };

      return (
        <ModalWrapperFull divName='roomMovement' id='roomMovement'>
          <AlignRight>
            <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
              X
            </TopButton>
          </AlignRight>
          <TextWrapper>Do you really wish to move to room {selectedRoom}?</TextWrapper>
          <ButtonWrapper>
            <MoveButton style={{ pointerEvents: 'auto' }} onClick={move}>
              Move
            </MoveButton>
          </ButtonWrapper>
        </ModalWrapperFull>
      );
    }
  );
}

const AlignRight = styled.div`
  text-align: left;
  margin: 0px;
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

const TextWrapper = styled.div`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: center;
`;

const MoveButton = styled.button`
  background-color: #0088cc;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: #006699;
  }
`;
