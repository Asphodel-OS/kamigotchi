import React, { useEffect } from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from '../engine/store';
import { dataStore } from '../store/createStore';
import styled, { keyframes } from 'styled-components';
import './font.css';
import { ModalWrapper } from './styled/AnimModalWrapper';

export function registerObjectModal() {
  registerUIComponent(
    'ObjectModal',
    {
      colStart: 3,
      colEnd: 82,
      rowStart: 76,
      rowEnd: 99,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleDivs,
        setVisibleDivs,
        objectData: { description },
      } = dataStore();

      const hideModal = () => {
        setVisibleDivs({
          ...visibleDivs,
          objectModal: !visibleDivs.objectModal,
        });
      };

      const showShop = () => {
        setVisibleDivs({
          ...visibleDivs,
          merchant: !visibleDivs.merchant,
        });
      };

      useEffect(() => {
        if (visibleDivs.objectModal === true)
          document.getElementById('object_modal')!.style.display = 'block';
      }, [visibleDivs.objectModal]);

      return (
        <ModalWrapper id="object_modal" isOpen={visibleDivs.objectModal}>
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
        </ModalWrapper>
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
