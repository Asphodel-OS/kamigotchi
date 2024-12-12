import React, { useEffect } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ActionButton, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import { DialogueNode, dialogues } from 'constants/dialogue';
import { ActionParam } from 'constants/dialogue/types';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getRoomByIndex } from 'network/shapes/Room';
import { getBalance } from 'network/shapes/utils';

export function registerDialogueModal() {
  registerUIComponent(
    'DialogueModal',
    {
      colStart: 2,
      colEnd: 67,
      rowStart: 75,
      rowEnd: 99,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;

          const accountEntity = queryAccountFromEmbedded(network);

          return {
            network: layers.network,
            data: { accEntity: accountEntity },
          };
        })
      ),

    // Render
    ({ data, network }) => {
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
      // INTERPRETATION

      const getText = (raw: (typeof dialogueNode.text)[number]) => {
        if (typeof raw === 'string') return raw;
        else if (typeof raw === 'function') return raw(getArgs());
        return '';
      };

      const getArgs = () => {
        if (!dialogueNode.args) return [];

        const result: any[] = [];
        dialogueNode.args.forEach((param) => {
          result.push(getBalance(world, components, data.accEntity, param.index, param.type));
        });

        return result;
      };

      //////////////////
      // ACTIONS

      const getAction = (type: string, input: number) => {
        if (type === 'move') return move(input);
        else if (type === 'goal') return triggerGoalModal([input]);
      };

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
        let action: ActionParam;
        let disabled = false;

        // split by step if action is an array
        if ('label' in dialogueNode.action) {
          // only on last step
          action = dialogueNode.action;
          disabled = step !== dialogueLength - 1 && !!action;
        } else {
          // per step
          action = dialogueNode.action[step];
          disabled = action === undefined;
        }

        if (disabled) return <div />;

        return (
          <ActionButton
            text={action.label}
            disabled={disabled}
            onClick={() => getAction(action.type, action.input)} // hardcoded for now
          />
        );
      };

      return (
        <ModalWrapper id='dialogue' canExit overlay>
          <Text>
            {getText(dialogueNode.text[step])}
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
