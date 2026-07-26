import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount, getAccountKamis as _getAccountKamis } from 'app/cache/account';
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

const NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS = 24 * 60 * 60;

// TODO: maybe in the future
// have another dialogue modal
// just for npcs?
export const DialogueModal: UIComponent = {
  id: 'DialogueModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

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
          getAccountKamis: (entity: EntityIndex) => _getAccountKamis(world, components, entity),
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

    /////////////////
    // INSTANTIATIONS

    const { actions, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete, OwnsKamiID } = components;
    const { queryRegistry, queryOngoing, getBase, populate, filterByAvailable, queryCompleted } =
      utils;

    const dialogueModalOpen = useVisibility((s) => s.modals.dialogue);
    const setModals = useVisibility((s) => s.setModals);
    const dialogueIndex = useSelected((s) => s.dialogueIndex);
    const setDialogue = useSelected((s) => s.setDialogue);

    const [step, setStep] = useState(0);
    const [dialogueHistory, setDialogueHistory] = useState<number[]>([]);
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
    const [ongoingQuests, setOngoingQuests] = useState<Quest[]>([]);
    const [account, setAccount] = useState<Account>(NullAccount);
    const [hasAnyKamis, setHasAnyKamis] = useState(false);
    const endDialogueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const internalDialogueTransitionRef = useRef(false);
    const dialogueNode = useMemo<DialogueNode>(
      () => dialogues[dialogueIndex] ?? dialogues[0],
      [dialogueIndex]
    );
    const dialogueLength = dialogueNode.text.length;
    const npc = useMemo(() => {
      const npcData = dialogueNode.npc;
      return {
        name: npcData?.name ?? '',
        img: npcData?.img ?? '',
        color: npcData?.color ?? '#cc88ff',
        mood: npcData?.mood ?? '',
        special: npcData?.special ?? { name: '', onclick: () => void 0 },
      };
    }, [dialogueNode.npc]);
    const dialogueOptions = useMemo(
      () => (dialogueNode.next ? Array.from(dialogueNode.next.entries()) : []),
      [dialogueNode.next]
    );
    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];
    const ownsKamiEntities = useComponentEntities(OwnsKamiID) || [];

    /////////////////
    // SUBSCRIPTIONS

    // reset the step to 0 whenever the dialogue modal is toggled
    useEffect(() => {
      setStep(0);
      if (!dialogueModalOpen) setDialogueHistory([]);
    }, [dialogueModalOpen]);

    // reset text step when changing dialogue entry
    // clear history only when dialogue root is changed externally while modal is still open
    useEffect(() => {
      setStep(0);
      if (dialogueModalOpen && !internalDialogueTransitionRef.current) {
        setDialogueHistory([]);
      }
      internalDialogueTransitionRef.current = false;
    }, [dialogueIndex, dialogueModalOpen]);

    // update account data when the modal opens and when kami ownership changes
    useEffect(() => {
      if (!dialogueModalOpen) return;
      const account = utils.getAccount(accEntity);
      setAccount(account);
      setHasAnyKamis(utils.getAccountKamis(accEntity).length > 0);
    }, [dialogueModalOpen, accEntity, ownsKamiEntities]);

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

    useEffect(() => {
      if (endDialogueTimeoutRef.current) {
        clearTimeout(endDialogueTimeoutRef.current);
        endDialogueTimeoutRef.current = null;
      }
    }, [dialogueIndex, dialogueModalOpen, step]);

    useEffect(() => {
      return () => {
        if (endDialogueTimeoutRef.current) {
          clearTimeout(endDialogueTimeoutRef.current);
          endDialogueTimeoutRef.current = null;
        }
      };
    }, []);

    /////////////////
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
      const result: number[] = [];
      dialogueNode.args.forEach((param) => {
        result.push(getBalance(world, components, accEntity, param.index, param.type));
      });

      return result;
    };
    const shouldShowNpcSpecial = useMemo(() => {
      if (!npc.special.name) return false;
      if (npc.special.name !== 'Kami Adoption Agency') return true;
      if (hasAnyKamis) return false;
      const now = Math.floor(Date.now() / 1000);
      return now - account.time.creation <= NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS;
    }, [account.time.creation, hasAnyKamis, npc.special.name]);
    const userQualifiesForAdoptionAgency = useMemo(() => {
      if (hasAnyKamis) return false;
      const now = Math.floor(Date.now() / 1000);
      return now - account.time.creation <= NEWBIE_VENDOR_MAX_ACCOUNT_AGE_SECONDS;
    }, [account.time.creation, hasAnyKamis]);

    /////////////////
    // ACTIONS

    useEffect(() => {
      if (!dialogueModalOpen) return;
      if (dialogueIndex !== 30001) return;
      if (!userQualifiesForAdoptionAgency) return;
      setModals({ kamiAdoptionAgency: true });
    }, [dialogueIndex, dialogueModalOpen, setModals, userQualifiesForAdoptionAgency]);

    const handleNpcDialogueComplete = useCallback(() => {
      if (!dialogueModalOpen) return;
      if (!dialogueNode.npc?.endDialogue) return;
      if (step !== dialogueLength - 1) return;

      if (endDialogueTimeoutRef.current) clearTimeout(endDialogueTimeoutRef.current);
      endDialogueTimeoutRef.current = setTimeout(() => {
        setModals({ dialogue: false });
      }, 3000);
    }, [dialogueLength, dialogueModalOpen, dialogueNode.npc?.endDialogue, setModals, step]);

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

    const transitionDialogue = (nextDialogueIndex: number) => {
      internalDialogueTransitionRef.current = true;
      setDialogue(nextDialogueIndex);
    };

    /////////////////
    // DISPLAY

    const BackButton = () => {
      const disabled = step === 0 && dialogueHistory.length === 0;
      return (
        <div style={{ visibility: disabled ? 'hidden' : 'visible' }}>
          <IconButton
            scale={1.8}
            img={ArrowIcons.left}
            disabled={disabled}
            onClick={() => {
              if (step > 0) {
                setStep(step - 1);
                return;
              }
              const previousDialogue = dialogueHistory[dialogueHistory.length - 1];
              if (previousDialogue === undefined) return;
              setDialogueHistory((prev) => prev.slice(0, -1));
              transitionDialogue(previousDialogue);
            }}
          />
        </div>
      );
    };

    const canAdvance = step < dialogueLength - 1 || !!dialogueNode.npc?.nextDialogue;

    // shared by the next arrow and clicks on completed dialogue text
    const advanceDialogue = () => {
      if (step < dialogueLength - 1) {
        setStep(step + 1);
        return;
      }
      if (dialogueNode.npc?.nextDialogue) {
        setDialogueHistory((prev) => [...prev, dialogueIndex]);
        setStep(0);
        transitionDialogue(dialogueNode.npc.nextDialogue);
      }
    };

    const NextButton = () => {
      const disabled = !canAdvance;
      return (
        <div
          style={{
            visibility: disabled ? 'hidden' : 'visible',
          }}
        >
          <IconButton scale={1.8} img={ArrowIcons.right} disabled={disabled} onClick={advanceDialogue} />
        </div>
      );
    };
    const MiddleButton = () => {
      if (!dialogueNode.action) return <div />;

      let actions: ActionParam[];

      if ('label' in dialogueNode.action) {
        // single action: show on last step only
        if (step !== dialogueLength - 1) return <div />;
        actions = [dialogueNode.action];
      } else {
        // per-step array
        const entry = dialogueNode.action[step];
        if (entry === undefined) return <div />;
        actions = Array.isArray(entry) ? entry : [entry];
      }

      return (
        <div style={{ display: 'flex', gap: '0.5vw' }}>
          {actions.map((action, i) => (
            <ActionButton
              key={i}
              text={action.label}
              disabled={isDisabled(action)}
              onClick={() => {
                action.onClick?.();
                getAction(action.type, action.input);
              }}
            />
          ))}
        </div>
      );
    };

    /////////////////
    // RENDER

    if (npc.name.length > 0) {
      return (
        <ModalWrapper
          id='dialogue'
          header={<Header $color={npc.color}>{npc.name}</Header>}
          canExit
          backgroundColor={'white'}
          positionOverride={{
            colStart: 66,
            colEnd: 99,
            rowStart: 7,
            rowEnd: 84,
            position: 'fixed',
          }}
          noScroll
          truncate
        >
          <NpcDialogue
            key={String(dialogueModalOpen)} /* remount per open so text retypes fresh */
            hasAvailableQuests={availableQuests}
            hasOngoingQuests={ongoingQuests}
            npcColor='#000000ff'
            npcName={npc.name}
            npcImage={npc.mood || npc.img}
            dialogueText={getText(dialogueNode.text[step])}
            twoColumnText={dialogueIndex === 20018}
            onDialogueComplete={handleNpcDialogueComplete}
            onTextAdvance={canAdvance ? advanceDialogue : undefined}
            dialogueOptions={dialogueOptions.map(([label, nextIndex]) => ({
              label,
              onClick: () => {
                setDialogueHistory((prev) => [...prev, dialogueIndex]);
                setStep(0);
                transitionDialogue(nextIndex);
              },
            }))}
            dialogueButtons={{
              BackButton: BackButton,
              NextButton: NextButton,
              MiddleButton: MiddleButton,
            }}
            special={shouldShowNpcSpecial ? npc.special : undefined}
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

const Header = styled.div<{ $color: string }>`
  padding: 1vw;
  font-size: 1.4vw;
  color: ${(props) => props.$color};
  border-color: white;
`;
