import React, { useEffect } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { DialogueNode, dialogues } from 'constants/dialogue';
import { getRoomByIndex } from 'layers/network/shapes/Room';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { useSelected, useVisibility } from 'layers/react/store';

export function registerDialogueModal() {
  registerUIComponent(
    'DialogueModal',
    {
      colStart: 21,
      colEnd: 81,
      rowStart: 75,
      rowEnd: 100,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          return { network: layers.network };
        })
      ),

    // Render
    ({ network }) => {
      const { actions, components, world } = network;
      const { modals } = useVisibility();
      const { dialogueIndex } = useSelected();
      const [dialogueNode, setDialogueNode] = React.useState({
        text: [''],
      } as DialogueNode);
      const [dialogueLength, setDialogueLength] = React.useState(0);
      const [step, setStep] = React.useState(0);

      // reset the step to 0 whenever the dialogue modal is toggled
      useEffect(() => setStep(0), [modals.dialogue]);

      // set the current dialogue node when the dialogue index changes
      useEffect(() => {
        setStep(0);
        setDialogueNode(dialogues[dialogueIndex]);
        setDialogueLength(dialogues[dialogueIndex].text.length);
      }, [dialogueIndex]);

      //////////////////
      // ACTIONS

      const move = (roomIndex: number) => {
        const room = getRoomByIndex(world, components, roomIndex);

        actions.add({
          action: 'AccountMove',
          params: [roomIndex],
          description: `Moving to ${room.name}`,
          execute: async () => {
            const roomMovment = await network.api.player.account.move(roomIndex);
            return roomMovment;
          },
        });
      };

      //////////////////
      // DISPLAY

      const BackButton = () => {
        const disabled = step === 0;
        return (
          <div style={{ visibility: disabled ? 'hidden' : 'visible' }}>
            <ActionButton text='←' disabled={disabled} onClick={() => setStep(step - 1)} />
          </div>
        );
      };

      const NextButton = () => {
        const disabled = step === dialogueLength - 1;
        return (
          <div
            style={{
              visibility: disabled ? 'hidden' : 'visible',
            }}
          >
            <ActionButton text='→' disabled={disabled} onClick={() => setStep(step + 1)} />
          </div>
        );
      };

      const MiddleButton = () => {
        if (!dialogueNode.action) return <div />;
        const action = dialogueNode.action;
        const disabled = step !== dialogueLength - 1 && !!action;

        return (
          <div
            style={{
              visibility: disabled ? 'hidden' : 'visible',
            }}
          >
            <ActionButton
              text={action.label}
              disabled={disabled}
              onClick={() => move(action.input)} // hardcoded for now
            />
          </div>
        );
      };

      return (
        <ModalWrapper id='dialogue_modal' divName='dialogue' canExit overlay>
          <Text>
            {dialogueNode.text[step]}
            <ButtonRow>
              <BackButton />
              <MiddleButton />
              <NextButton />
            </ButtonRow>
          </Text>
        </ModalWrapper>
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
  padding: 0.7vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;
