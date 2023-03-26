import React, { useEffect } from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import styled from 'styled-components';
import 'layers/react/styles/font.css';
import { ModalWrapperLite } from '../library/ModalWrapper';

// TODO: update this file and component name to be more desctiptive
export function registerDialogueModal() {
  registerUIComponent(
    'DialogueModal',
    {
      colStart: 3,
      colEnd: 82,
      rowStart: 76,
      rowEnd: 99,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals,
        setVisibleModals,
        dialogue: { description },
      } = dataStore();

      const hideModal = () => {
        setVisibleModals({
          ...visibleModals,
          dialogue: !visibleModals.dialogue,
        });
      };

      const showShop = () => {
        setVisibleModals({
          ...visibleModals,
          merchant: !visibleModals.merchant,
        });
      };

      useEffect(() => {
        if (visibleModals.dialogue === true)
          document.getElementById('object_modal')!.style.display = 'block';
      }, [visibleModals.dialogue]);

      return (
        <ModalWrapperLite id="object_modal" isOpen={visibleModals.dialogue}>
          <ModalContent>
            <AlignRight>
              <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
                X
              </TopButton>
            </AlignRight>
            <Description>{description}</Description>
            <div style={{ textAlign: 'right' }}>
              <Button style={{ pointerEvents: 'auto' }} onClick={showShop}>
                Shop
              </Button>
            </div>
          </ModalContent>
        </ModalWrapperLite>
      );
    }
  );
}

const AlignRight = styled.div`
  text-align: right;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
`;

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 18px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;

const Description = styled.p`
  font-size: 22px;
  color: #333;
  text-align: center;
  padding: 20px;
  font-family: Pixel;
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
    background-color: #c2c2c2;
  }
`;
