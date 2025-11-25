import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { getRoomByIndex } from 'app/cache/room';
import { ActionButton, IconButton, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { triggerGoalModal, triggerKamiBridgeModal, triggerTradingModal } from 'app/triggers';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { DialogueNode, dialogues } from 'constants/dialogue';
import { ActionParam } from 'constants/dialogue/types';
import { EntityID, EntityIndex } from 'engine/recs';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  filterOngoingQuests,
  filterQuestsByAvailable,
  getBaseQuest,
  populateQuest,
  queryCompletedQuests,
  queryOngoingQuests,
  queryRegistryQuests,
  Quest,
} from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { canEnterRoom } from 'network/shapes/Room';
import { getBalance } from 'network/shapes/utils';
import { useComponentEntities } from 'network/utils/hooks';
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
      data: { accEntity },
      utils,
    } = (() => {
      const { network } = layers;

      const accountEntity = queryAccountFromEmbedded(network);
      const { world, components } = network;

      const accRefresh = {
        live: 1,
        inventory: 1,
        config: 3600,
      };

      return {
        network: layers.network,
        data: { accEntity: accountEntity },
        utils: {
          queryRegistry: () => queryRegistryQuests(components),
          getBase: (entity: EntityIndex) => getBaseQuest(world, components, entity),
          populate: (base: BaseQuest) => populateQuest(world, components, base),
          getAccount: (entity: EntityIndex) => _getAccount(world, components, entity, accRefresh),
          queryOngoing: (accountId: EntityID) => queryOngoingQuests(components, accountId),
          queryCompleted: (account: Account) => queryCompletedQuests(components, account.id),
          filterByAvailable: (
            registry: BaseQuest[],
            ongoing: BaseQuest[],
            completed: BaseQuest[],
            account: Account
          ) => filterQuestsByAvailable(world, components, account, registry, ongoing, completed),
        },
      };
    })();

    const { actions, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const { queryRegistry, queryOngoing, getBase, populate, filterByAvailable, queryCompleted } =
      utils;

    const dialogueModalOpen = useVisibility((s) => s.modals.dialogue);
    const setModals = useVisibility((s) => s.setModals);
    const dialogueIndex = useSelected((s) => s.dialogueIndex);

    const [dialogueNode, setDialogueNode] = useState({
      text: [''],
    } as DialogueNode);
    const [dialogueLength, setDialogueLength] = useState(0);
    const [step, setStep] = useState(0);
    const [npc, setNpc] = useState({ name: '' });
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
    const [ongoingQuests, setOngoingQuests] = useState<Quest[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);

    /////////////////
    // SUBSCRIPTION

    // reset the step to 0 whenever the dialogue modal is toggled
    useEffect(() => setStep(0), [dialogueModalOpen]);

    // set the current dialogue node when the dialogue index changes
    useEffect(() => {
      setStep(0);
      setDialogueNode(dialogues[dialogueIndex]);
      setDialogueLength(dialogues[dialogueIndex].text.length);
      setNpc(dialogues[dialogueIndex].npc || { name: '' });
    }, [dialogueIndex]);

    // update account data when the modal opens
    useEffect(() => {
      if (!dialogueModalOpen) return;
      const account = utils.getAccount(accEntity);
      setAccount(account);
    }, [dialogueModalOpen, accEntity]);

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

    const completed: BaseQuest[] = useMemo(() => {
      return queryCompleted(account).map((entity) => getBase(entity));
    }, [account.id, ownsQuestEntities, isCompleteEntities]);

    const ongoing = useMemo(() => {
      return queryOngoing(account.id).map((entity) => getBase(entity));
    }, [account.id, ownsQuestEntities, isCompleteEntities]);

    useEffect(() => {
      if (!dialogueModalOpen || npc.name.length === 0) return;
      const available = filterByAvailable(registry, ongoing, completed, account).map((q) =>
        populate(q)
      );
      const populatedOngoing = ongoing.map((q) => populate(q));
      const filteredOngoing = filterOngoingQuests(populatedOngoing);
      const filterMinaQuests = (baseQuests: Quest[]): Quest[] => {
        return baseQuests.filter(
          (quest) => quest.subType.toLowerCase() === npc.name.toLowerCase() && !quest.complete
        );
      };
      setAvailableQuests(filterMinaQuests(available));
      setOngoingQuests(filterMinaQuests(filteredOngoing));
    }, [
      dialogueModalOpen,
      dialogueIndex,
      registryEntities,
      ownsQuestEntities,
      isCompleteEntities,
      account,
      completed,
      npc.name,
    ]);
    //////////////////
    // INTERPRETATION

    const isDisabled = (action: ActionParam) => {
      if (action.type === 'move') {
        const room = getRoomByIndex(world, components, action.input ?? 0);
        return !canEnterRoom(world, components, account, room);
      }
      return action === undefined;
    };

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
      let show = false;

      // split by step if action is an array
      if ('label' in dialogueNode.action) {
        // only on last step
        action = dialogueNode.action;
        show = step !== dialogueLength - 1 && !!action;
      } else {
        // per step
        action = dialogueNode.action[step];
        show = action === undefined;
      }

      if (show) return <div />;

      return (
        <ActionButton
          text={action.label}
          disabled={isDisabled(action)}
          onClick={() => getAction(action.type, action.input)} // hardcoded for now
        />
      );
    };

    //////////////////
    // NPCS DIALOGUES

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
