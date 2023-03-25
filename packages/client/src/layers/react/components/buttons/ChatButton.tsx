import React from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import styled from 'styled-components';
import 'layers/react/styles/font.css';
import clickSound from 'assets/sound/fx/mouseclick.wav';
import { useModalVisibility } from 'layers/react/hooks/useHandleModalVisibilty';

export function registerChatButton() {
  registerUIComponent(
    'ChatButton',
    {
      colStart: 88,
      colEnd: 100,
      rowStart: 82,
      rowEnd: 86,
    },
    (layers) => of(layers),
    () => {
      const { handleClick } = useModalVisibility({
        soundUrl: clickSound,
        divName: 'chat',
        elementId: 'chat_modal',
      });

      return (
        <ModalWrapper id="chat_button">
          <ModalContent>
            <Button style={{ pointerEvents: 'auto' }} onClick={handleClick}>
              Chat
            </Button>
          </ModalContent>
        </ModalWrapper>
      );
    }
  );
}

const ModalWrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  display: block;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  padding: 8px;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 5px;
  font-family: Pixel;

  &:active {
    background-color: #c2c2c2;
  }
`;
