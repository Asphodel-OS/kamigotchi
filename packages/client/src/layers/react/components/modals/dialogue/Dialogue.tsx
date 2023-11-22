import React, { useCallback, useEffect } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { DialogueNode, dialogueMap } from 'constants/phaser/dialogue';
import { registerUIComponent } from 'layers/react/engine/store';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import 'layers/react/styles/font.css';


export function registerDialogueModal() {
  registerUIComponent(
    'DialogueModal',
    {
      colStart: 21,
      colEnd: 81,
      rowStart: 75,
      rowEnd: 100,
    },
    (layers) => of(layers),
    () => {
      const { modals } = useComponentSettings();
      const { dialogueIndex } = useSelectedEntities();
      const [dialogueNode, setDialogueNode] = React.useState({ text: [''] } as DialogueNode);
      const [dialogueLength, setDialogueLength] = React.useState(0);
      const [step, setStep] = React.useState(0);

      // reset the step to 0 whenever the dialogue modal is toggled
      useEffect(() => setStep(0), [modals.dialogue]);

      // set the current dialogue node when the dialogue index changes
      useEffect(() => {
        setStep(0);
        setDialogueNode(dialogueMap[dialogueIndex]);
        setDialogueLength(dialogueMap[dialogueIndex].text.length);
      }, [dialogueIndex]);


      const BackButton = () => {
        const disabled = step === 0;
        return (
          <div style={{ visibility: disabled ? 'hidden' : 'visible' }}>
            <ActionButton
              id='back'
              text='←'
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            />
          </div>
        );
      }

      const NextButton = () => {
        const disabled = step === dialogueLength - 1;
        return (
          <div style={{
            visibility: disabled ? 'hidden' : 'visible',
          }}>
            <ActionButton
              id='next'
              text='→'
              disabled={step === dialogueLength - 1}
              onClick={() => setStep(step + 1)}
            />
          </div>
        );
      }


      return (
        <ModalWrapperFull
          id='dialogue_modal'
          divName='dialogue'
          canExit
          overlay
        >
          <Text>
            {dialogueNode.text[step]}
            <ButtonRow>
              <BackButton />
              <NextButton />
            </ButtonRow>
          </Text>

        </ModalWrapperFull>
      );
    }
  );
}

const Text = styled.div`
  background-color: #ffc;
  color: #339;
  height: 100%;
  width: 100%;
  padding: 0vw 9vw;

  display: flex;
  flex-grow: 1;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  font-family: Pixel;
  font-size: 1.1vw;
  text-align: center;
  line-height: 1.8vw;
`;

const ButtonRow = styled.div`
  position: absolute;
  align-self: center;
  width: 100%;
  bottom: 0;
  padding: .7vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;
