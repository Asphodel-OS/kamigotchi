import { QuestsIcon } from 'assets/images/icons/menu';
import { EntityIndex } from 'engine/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { getItemByIndex } from 'app/cache/item';
import { ModalWrapper } from 'app/components/library';
import { Palette } from 'app/components/library/pastel';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { getAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemBalance as _getItemBalance } from 'network/shapes/Item';
import {
  Quest,
  canRepeatQuest,
  filterOngoingQuests,
  findNextQuestInChain,
  getBaseQuest,
  getQuestByEntityIndex,
  meetsObjectives,
  parseQuestObjectives,
  parseQuestStatus,
  populateQuest,
  queryQuestInstance,
  queryRegistryQuests,
} from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { getRoomIndexByName } from 'network/shapes/Room';
import { getFromDescription } from 'network/shapes/utils/parse';
import { useComponentEntities } from 'network/utils/hooks';
import { playClick, playQuestaccept, playQuestcomplete } from 'utils/sounds';
import { Bottom, QuestStatus } from './Bottom';
import { Dialogue } from './Dialogue';

const REFRESH_INTERVAL = 3333;

export const QuestDetailsModal: UIComponent = {
  id: 'QuestDetails',
  Render: () => {
    const layers = useLayers();
    const { network, data, utils } = (() => {
      const { network } = layers;
      const { world, components } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const account = getAccount(world, components, accountEntity, {
        kamis: true,
        inventory: true,
      });
      return {
        network,
        data: {
          accountEntity,
          account,
        },
        utils: {
          getQuestByEntityIndex: (entity: EntityIndex) =>
            getQuestByEntityIndex(world, components, entity),
          parseQuestStatus: (quest: Quest) => parseQuestStatus(world, components, account, quest),
          queryRegistry: () => queryRegistryQuests(components),
          getBase: (entity: EntityIndex) => getBaseQuest(world, components, entity),
          populate: (base: BaseQuest) => populateQuest(world, components, base),
          parseObjectives: (quest: Quest) =>
            parseQuestObjectives(world, components, account, quest),
          findRoomByName: (name: string) => getRoomIndexByName(world, components, name),
          describeEntity: (type: string, index: number) =>
            getFromDescription(world, components, type, index),
          findNextInChain: (questIndex: number) => {
            const registry = queryRegistryQuests(components).map((e) =>
              getBaseQuest(world, components, e)
            );
            return findNextQuestInChain(world, components, account, questIndex, registry);
          },
          getItem: (index: number) => getItemByIndex(world, components, index),
          getItemBalance: (index: number) => _getItemBalance(world, components, account.id, index),
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions, api, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const {
      getBase,
      populate,
      parseObjectives,
      describeEntity,
      findRoomByName,
      findNextInChain,
      getItem,
      getItemBalance,
    } = utils;

    const isModalOpen = useVisibility((s) => s.modals.questDialogue);
    const setModals = useVisibility((s) => s.setModals);
    const questIndex = useSelected((s) => s.questIndex);

    const [quest, setQuest] = useState<Quest>();
    const [tick, setTick] = useState(Date.now());
    const [justCompleted, setJustCompleted] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevCompleteRef = useRef<boolean | undefined>(undefined);

    // Reactively subscribe to ECS changes relevant to quests
    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];

    /////////////////
    // SUBSCRIPTIONS
    // this is for the outro animation to work as it should
    // even if the quest is completed directly
    // from the quest view

    useEffect(() => {
      const completedQuestIndex = useSelected.getState().questJustCompleted;
      if (completedQuestIndex === questIndex) {
        setJustCompleted(true);
        useSelected.setState({ questJustCompleted: null });
      } else {
        setJustCompleted(false);
      }
      prevCompleteRef.current = undefined;
    }, [questIndex]);

    // trigger outro aniamtion only once
    useEffect(() => {
      if (quest?.complete && prevCompleteRef.current === false) {
        setJustCompleted(true);
      }
      prevCompleteRef.current = quest?.complete;
    }, [quest?.complete]);

    // close modal after completion if no completion text or next quest
    useEffect(() => {
      if (!justCompleted || !quest?.complete) return;

      const hasCompletionText = !!quest?.descriptionAlt;
      const hasNextQuest = !!(quest && findNextInChain(quest.index));

      if (!hasCompletionText && !hasNextQuest) {
        const closeModal = () => setModals({ questDialogue: false });
        timeoutRef.current = setTimeout(closeModal, 500);
      }
    }, [justCompleted, quest?.complete]);

    // this fixes a bug where completing one quest would close
    // another quests dialogue if opened before the timeout fired

    useEffect(() => {
      if (!isModalOpen || questIndex == null) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }, [isModalOpen, questIndex]);

    useEffect(() => {
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => {
        clearInterval(timerId);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    // populate the quest data whenever the modal is open
    useEffect(() => {
      if (!isModalOpen) return;
      if (questIndex == null) {
        setQuest(undefined);
        return;
      }

      const base = getBase(questIndex);
      const instance = queryQuestInstance(world, base.index, data.accountEntity);
      const entityToUse = instance ?? questIndex;

      const actualBase = getBase(entityToUse);
      const populated = populate(actualBase);
      const parsed = parseObjectives(populated);
      const filtered = filterOngoingQuests([parsed]);
      setQuest(filtered[0]);
    }, [tick, questIndex, isModalOpen, registryEntities, ownsQuestEntities, isCompleteEntities]);

    /////////////////
    // ACTIONS

    // always close modal after Accept/Complete, if there is no completion text
    const handleStateUpdate = (willComplete = false) => {
      const hasCompletionText = !!quest?.descriptionAlt;
      const hasNextQuest = !!(quest && findNextInChain(quest.index));
      if (!willComplete || (!hasCompletionText && !hasNextQuest)) {
        const closeModal = () => setModals({ questDialogue: false });
        timeoutRef.current = setTimeout(closeModal, 500);
      }
    };

    // accept an available quest
    const acceptQuest = async (quest: BaseQuest) => {
      const tx = actions.add({
        action: 'QuestAccept',
        params: [quest.index * 1],
        description: `Accepting Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.accept(quest.index);
        },
      });
      handleStateUpdate();
    };

    // complete an ongoing quest
    const completeQuest = async (quest: BaseQuest) => {
      setJustCompleted(true);
      const tx = actions.add({
        action: 'QuestComplete',
        params: [quest.id],
        description: `Completing Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.complete(quest.id);
        },
      });
      handleStateUpdate(true);
    };

    // journey onwards to next quest in chain
    const journeyOnwards = () => {
      if (quest?.index === undefined) {
        setModals({ questDialogue: false });
        playClick();
        return;
      }
      const nextQuest = findNextInChain(quest.index);
      setModals({ questDialogue: false });
      if (nextQuest) {
        useSelected.setState({ questIndex: nextQuest.entity });
        setTimeout(() => setModals({ questDialogue: true }), 250);
      }
      playClick();
    };

    const burnQuestItems = async (indices: number[], amts: number[]) => {
      let description = 'Giving';
      for (let i = 0; i < indices.length; i++) {
        const item = getItem(indices[i]);
        description += ` ${amts[i]} ${item.name}`;
      }

      actions.add({
        action: 'ItemBurn',
        params: [indices, amts],
        description,
        execute: async () => {
          return api.player.account.item.burn(indices, amts);
        },
      });
    };

    if (!quest) return <></>;

    const status: QuestStatus = (() => {
      if (quest.startTime === 0) return 'AVAILABLE';
      if (quest.complete && canRepeatQuest(quest)) return 'AVAILABLE';
      if (quest.complete) return 'COMPLETED';
      return 'ONGOING';
    })();

    const TopBar = (
      <Top>
        <TopIcon src={QuestsIcon} alt='Quest' />
        <Title>{quest.name}</Title>
      </Top>
    );

    const isFinal = quest.complete && !canRepeatQuest(quest);
    const Footer = (
      <Bottom
        rewards={quest.rewards}
        objectives={quest.objectives}
        describeEntity={describeEntity}
        findRoomByName={findRoomByName}
        burnItems={burnQuestItems}
        getItemBalance={getItemBalance}
        questStatus={status}
        buttons={{
          AcceptButton: {
            onClick: isFinal
              ? journeyOnwards
              : () => {
                  acceptQuest(quest);
                  playQuestaccept();
                },
            disabled: isFinal
              ? !findNextInChain(quest.index)
              : quest.startTime !== 0 && !canRepeatQuest(quest),
            label: isFinal ? 'Journey Onwards' : 'Accept',
          },
          CompleteButton: {
            onClick: () => {
              completeQuest(quest);
              playQuestcomplete();
            },
            disabled: !meetsObjectives(quest) || quest.complete || quest.startTime === 0,
            label: 'Complete',
          },
        }}
      />
    );

    return (
      <ModalWrapper id='questDialogue' header={TopBar} footer={Footer} canExit noScroll noPadding>
        <Dialogue
          isModalOpen={isModalOpen}
          text={quest.description.replace(/\n+/g, '\n')}
          completionText={quest?.descriptionAlt?.replace(/\n+/g, '\n')}
          isComplete={quest.complete}
          isAccepted={quest.startTime !== 0}
          justCompleted={justCompleted}
          onOutroFinished={() => setJustCompleted(false)}
        />
      </ModalWrapper>
    );
  },
};

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8vw;
  padding: 0.7vw 3.6vw 0.7vw 1.2vw;
  user-select: none;
`;

const TopIcon = styled.img`
  width: 2.2vw;
  height: 2.2vw;
  user-drag: none;
`;

const Title = styled.span`
  flex: 1;
  min-width: 0;
  font-family: Pixel;
  font-size: 1.05vw;
  line-height: 1.35;
  color: ${Palette.ink};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
