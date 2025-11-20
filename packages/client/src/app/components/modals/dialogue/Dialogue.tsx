import { ActionButton, IconButton, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { triggerGoalModal, triggerKamiBridgeModal, triggerTradingModal } from 'app/triggers';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { DialogueNode, dialogues } from 'constants/dialogue';
import { ActionParam } from 'constants/dialogue/types';
import { EntityIndex } from 'engine/recs';
import { getAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  getBaseQuest,
  parseQuestObjectives,
  populateQuest,
  queryOngoingQuests,
  queryRegistryQuests,
} from 'network/shapes/Quest';
import { BaseQuest, Quest } from 'network/shapes/Quest/quest';
import { getRoomByIndex } from 'network/shapes/Room';
import { getBalance } from 'network/shapes/utils';
import { useComponentEntities } from 'network/utils/hooks';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NpcDialogue } from './NpcDialogue';
// TODO: maybe in the future
// have another dialogue modal
// just for npcs?
export const DialogueModal: UIComponent = {
  id: 'DialogueModal',
  Render: () => {
    const layers = useLayers();

    const {
      network,
      data: { accEntity, account },
      utils,
    } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const account = getAccount(world, components, accountEntity, {
        kamis: true,
        inventory: true,
      });

      return {
        network,
        data: { accEntity: accountEntity, account },
        utils: {
          queryRegistry: () => queryRegistryQuests(components),
          queryOngoing: () => queryOngoingQuests(components, account.id),
          getBase: (entity: EntityIndex) => getBaseQuest(world, components, entity),
          populate: (base: BaseQuest) => populateQuest(world, components, base),
          parseObjectives: (quest: Quest) =>
            parseQuestObjectives(world, components, account, quest),
        },
      };
    })();

    const { actions, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const { queryRegistry, queryOngoing, getBase, populate, parseObjectives } = utils;
    const dialogueModalOpen = useVisibility((s) => s.modals.dialogue);
    const setModals = useVisibility((s) => s.setModals);

    const dialogueIndex = useSelected((s) => s.dialogueIndex);
    const [dialogueNode, setDialogueNode] = React.useState({
      text: [''],
    } as DialogueNode);
    const [dialogueLength, setDialogueLength] = React.useState(0);
    const [step, setStep] = React.useState(0);
    const [npc, setNpc] = React.useState({ name: '' });
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
    const [ongoingQuests, setOngoingQuests] = useState<Quest[]>([]);

    /////////////////
    // SUBSCRIPTION

    useEffect(() => setStep(0), [dialogueModalOpen]);

    // set the current dialogue node when the dialogue index changes
    useEffect(() => {
      setStep(0);
      setDialogueNode(dialogues[dialogueIndex]);
      setDialogueLength(dialogues[dialogueIndex].text.length);
      setNpc(dialogues[dialogueIndex].npc || { name: '' });
    }, [dialogueIndex]);

    useEffect(() => {
      if (npc.name.length > 0 && dialogueModalOpen) {
        setModals({
          inventory: false,
          questDialogue: false,
          quests: false,
          chat: false,
        });
      }
    }, [dialogueModalOpen, npc.name.length, setModals]);

    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];

    const registry = useMemo(() => {
      return queryRegistry().map((entity) => getBase(entity));
    }, [registryEntities]);

    const ongoing = useMemo(() => {
      return queryOngoing().map((entity) => getBase(entity));
    }, [account.id, ownsQuestEntities, isCompleteEntities]);

    useEffect(() => {
      if (!dialogueModalOpen || npc.name.length === 0) return;
      const filterMinaQuests = (baseQuests: BaseQuest[]): Quest[] => {
        return baseQuests
          .map((base) => populate(base))
          .map((populated) => parseObjectives(populated))
          .filter(
            (quest) => quest.subType.toLowerCase() === npc.name.toLowerCase() && !quest.complete
          );
      };
      setAvailableQuests(filterMinaQuests(registry));
      setOngoingQuests(filterMinaQuests(ongoing));
    }, [
      dialogueModalOpen,
      dialogueIndex,
      registryEntities,
      ownsQuestEntities,
      isCompleteEntities,
      registry,
      ongoing,
      npc.name,
    ]);

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
        result.push(getBalance(world, components, accEntity, param.index, param.type));
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
          <IconButton
            scale={1.8}
            img={ArrowIcons.left}
            disabled={disabled}
            onClick={() => setStep(step - 1)}
          />
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
          <IconButton
            scale={1.8}
            img={ArrowIcons.right}
            disabled={disabled}
            onClick={() => setStep(step + 1)}
          />
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
          onClick={() => getAction(action.type, action.input)}
        />
      );
    };

    if (npc.name.length > 0) {
      return (
        <ModalWrapper
          id='dialogue'
          header={<Header>{npc.name}</Header>}
          canExit
          backgroundColor={'rgba(0,0,0,1)'}
          positionOverride={{
            colStart: 66,
            colEnd: 99,
            rowStart: 7,
            rowEnd: 74,
            position: 'fixed',
          }}
          noScroll
        >
          <NpcDialogue
            hasAvailableQuests={availableQuests}
            hasOngoingQuests={ongoingQuests}
            npcColor='#ffffffff'
            npcName={npc.name}
            dialogueText={getText(dialogueNode.text[step])}
            dialogueButtons={{
              BackButton: BackButton,
              NextButton: NextButton,
              MiddleButton: MiddleButton,
            }}
          />
        </ModalWrapper>
      );
    }
    return (
      <ModalWrapper id='dialogue' canExit overlay>
        <Text>
          {getText(dialogueNode.text[step])}
          <ButtonRow>
            {BackButton()}
            {MiddleButton()}
            {NextButton()}
          </ButtonRow>
        </Text>
      </ModalWrapper>
    );
  },
};

const Text = styled.div`
  background-color: rgb(255, 255, 204);
  text-align: center;
  height: 100%;
  min-height: max-content;
  width: 100%;
  padding: 0vw 9vw;

  display: flex;
  flex-grow: 1;
  flex-flow: column nowrap;
  justify-content: center;

  font-size: 1.2vw;
  line-height: 2.4vw;
  white-space: pre-line;
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

const Header = styled.div`
  padding: 1vw;
  font-size: 1.4vw;
  color: #cc88ffff;
  border-color: white;
`;
