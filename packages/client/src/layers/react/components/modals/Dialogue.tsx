import React, { useCallback, useEffect } from 'react';
import { of } from 'rxjs';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';
import styled from 'styled-components';
import 'layers/react/styles/font.css';
import { ModalWrapperLite } from '../library/ModalWrapper';
import { Stepper } from '../library/Stepper';

// TODO: update this file and component name to be more desctiptive
export function registerDialogueModal() {
  registerUIComponent(
    'DialogueModal',
    {
      colStart: 2,
      colEnd: 60,
      rowStart: 60,
      rowEnd: 82,
    },
    (layers) => of(layers),
    () => {
      const {
        visibleModals,
        setVisibleModals,
        dialogue: { description: dialogueSteps },
      } = dataStore();

      const hideModal = useCallback(() => {
        setVisibleModals({ ...visibleModals, dialogue: false });
      }, [setVisibleModals, visibleModals]);

      const toggleMerchant = useCallback(() => {
        setVisibleModals({ ...visibleModals, merchant: !visibleModals.merchant });
      }, [setVisibleModals, visibleModals]);

      useEffect(() => {
        if (visibleModals.dialogue) {
          document.getElementById('object_modal')!.style.display = 'block';
        }
      }, [visibleModals.dialogue]);

      const steps = dialogueSteps.map((desc, i) => ({
        title: i.toString(),
        content: <Step description={desc} hideModal={hideModal} />,
      }));

      return (
        <ModalWrapperLite id='object_modal' isOpen={visibleModals.dialogue}>
          {dialogueSteps.length > 0 && <Stepper steps={steps} hideModal={hideModal} />}
        </ModalWrapperLite>
      );
    }
  );
}

const Step = ({ description, hideModal }: { description: string; hideModal: any }) => (
  <ModalContent>
    <AlignRight>
      <TopButton style={{ pointerEvents: 'auto' }} onClick={hideModal}>
        X
      </TopButton>
    </AlignRight>
    <Description>{description}</Description>
  </ModalContent>
);

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: center;
  font-family: Pixel;
`;

const AlignRight = styled.div`
  text-align: right;
  margin: 0px;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 5px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  height: 100%;
`;

const Description = styled.p`
  font-size: 20px;
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
    background-color: #c4c4c4;
  }
  margin: 0px;
`;
