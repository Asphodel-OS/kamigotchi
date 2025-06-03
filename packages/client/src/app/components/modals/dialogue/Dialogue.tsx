import React, { useEffect } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ActionButton, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { triggerGoalModal, triggerKamiBridgeModal, triggerTradingModal } from 'app/triggers';
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
      const [npc, setNpc] = React.useState({ name: '', background: '' });
      const [typing, setTyping] = React.useState<any>();

      useEffect(() => {
        setTyping(typeWriter(getText(dialogueNode.text[step])));
      }, [dialogueNode.text[step]]);

      // reset the step to 0 whenever the dialogue modal is toggled
      useEffect(() => setStep(0), [modals.dialogue]);

      // set the current dialogue node when the dialogue index changes
      useEffect(() => {
        setStep(0);
        setDialogueNode(dialogues[dialogueIndex]);
        setDialogueLength(dialogues[dialogueIndex].text.length);
        setNpc(dialogues[dialogueIndex].npc || { name: '', background: '' });
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

      const getAction = (type: string, input?: number) => {
        if (type === 'move') return move(input ?? 0);
        else if (type === 'goal') return triggerGoalModal([input ?? 0]);
        else if (type === 'erc721Bridge') return triggerKamiBridgeModal();
        else if (type === 'trading') return triggerTradingModal();
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

      //////////////////
      // NPCS DIALOGUES

      const typeWriter = (text: string) => {
        let maxSize = 49;
        let numberSlices = text.length / maxSize + 1;
        let sliceStart = 0;
        let sliceEnd = maxSize;
        let endLine = [' ', '.', ';', ','];
        let stringSliced: string[] = [];
        for (let i = 0; i <= numberSlices; i++) {
          if (sliceEnd > text.length) {
            stringSliced.push(text.slice(sliceStart));
            break;
          }
          while (!endLine.includes(text.charAt(sliceEnd))) {
            sliceEnd--;
          }
          stringSliced.push(text.slice(sliceStart, sliceEnd));
          sliceStart = sliceEnd;
          sliceEnd += maxSize;
        }
        return stringSliced.map((string, index) => (
          <Strings delay={index} key={text + index}>
            {string}
          </Strings>
        ));
      };

      return (
        <ModalWrapper
          id='dialogue'
          header={npc.name.length > 0 && <Header>{npc.name}</Header>}
          canExit
          overlay
          noPadding={npc.name.length > 0}
        >
          <Text npc={npc}>
            {npc.name.length > 0 ? typing : getText(dialogueNode.text[step])}
            <ButtonRow>
              {BackButton()}
              {MiddleButton()}
              {NextButton()}
            </ButtonRow>
          </Text>
        </ModalWrapper>
      );
    }
  );
}

const Text = styled.div<{ npc?: { name: string; background: string } }>`
  background-color: rgb(255, 255, 204);
  text-align: center;
  ${({ npc }) => npc && npc.background.length > 0 && `${npc?.background}; text-align: left`};
  height: 100%;
  min-height: max-content;
  width: 100%;
  padding: 0vw 9vw;

  display: flex;
  flex-grow: 1;
  flex-flow: column nowrap;
  justify-content: center;

  font-family: Pixel;
  font-size: 1.1vw;
  line-height: 1.8vw;
`;

const Header = styled.div`
  padding: 1vw;
  font-size: 1.1vw;
  color: #a800cf;
`;

const Strings = styled.div<{ delay: number }>`
  display: inline-block;
  color: #a800cf;
  white-space: nowrap;
  overflow: hidden;
  width: 0%;
  animation: type 2s steps(90, end) forwards;
  animation-delay: ${({ delay }) => delay * 2}s;
  @keyframes type {
    to {
      width: 100%;
    }
  }
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
