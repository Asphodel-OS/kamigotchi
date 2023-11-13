import React, { useEffect } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';
import { EntityID } from '@latticexyz/recs';
import crypto from "crypto";

import { registerUIComponent } from 'layers/react/engine/store';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { dataStore } from 'layers/react/store/createStore';
import { Room, getRoomByLocation } from 'layers/react/shapes/Room';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';

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

      const { visibleModals, setVisibleModals } = dataStore();
      const { room: location } = useSelectedEntities();
      const [selectedRoom, setSelectedRoom] = React.useState<Room>();

      useEffect(() => {
        if (location) {
          const room = getRoomByLocation(layers, location);
          setSelectedRoom(room);
        }
      }, [location]);


      //////////////////
      // ACTIONS

      const move = () => {
        if (!selectedRoom) return;
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;

        actions?.add({
          id: actionID,
          action: 'AccountMove',
          params: [location],
          description: `Moving to ${selectedRoom.name}`,
          execute: async () => {
            const roomMovment = await api.player.account.move(location);
            setVisibleModals({ ...visibleModals, roomMovement: false });
            return roomMovment;
          },
        });
      };


      //////////////////
      // RENDERING

      return (
        <ModalWrapperFull
          divName='roomMovement'
          id='roomMovement'
          canExit
          overlay
        >
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
