import { EntityIndex } from 'engine/recs';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { getAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import {
  Quest,
  filterOngoingQuests,
  getBaseQuest,
  getQuestByEntityIndex,
  meetsObjectives,
  parseQuestObjectives,
  parseQuestStatus,
  populateQuest,
  queryRegistryQuests,
} from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { didActionSucceed } from 'network/utils';
import { useComponentEntities } from 'network/utils/hooks';
import { Bottom } from './Bottom';
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
        },
      };
    })();

    /////////////////
    // INSTANTIATIONS

    const { actions, api, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const { getBase, populate, parseObjectives } = utils;

    const isModalOpen = useVisibility((s) => s.modals.questDialogue);
    const setModals = useVisibility((s) => s.setModals);
    const questIndex = useSelected((s) => s.questIndex);

    const [quest, setQuest] = useState<Quest>();
    const [tick, setTick] = useState(Date.now());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reactively subscribe to ECS changes relevant to quests
    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];

    /////////////////
    // SUBSCRIPTIONS

    // setup ticking on mount. clear timeout ref and ticking on dismount
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
      const populated = populate(base);
      const parsed = parseObjectives(populated);
      const filtered = filterOngoingQuests([parsed]);
      setQuest(filtered[0]);
    }, [tick, questIndex, isModalOpen, registryEntities, ownsQuestEntities, isCompleteEntities]);

    /////////////////
    // ACTIONS

    // always close modal after Accept/Complete, if there is no completion text
    const handleStateUpdate = async (txEntity: EntityIndex, willComplete = false) => {
      const actionSucceeded = await didActionSucceed(actions.Action, txEntity);
      if (actionSucceeded) {
        const hasCompletionText = !!quest?.descriptionAlt;
        if (!willComplete || !hasCompletionText) {
          const closeModal = () => setModals({ questDialogue: false });
          timeoutRef.current = setTimeout(closeModal, 500);
        }
      }
    };

    // accept an available quest (creates a player instance to track progress)
    const acceptQuest = async (quest: BaseQuest) => {
      const tx = actions.add({
        action: 'QuestAccept',
        params: [quest.index * 1],
        description: `Accepting Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.accept(quest.index);
        },
      });
      handleStateUpdate(tx);
    };

    // complete an ongoing quest
    const completeQuest = async (quest: BaseQuest) => {
      const tx = actions.add({
        action: 'QuestComplete',
        params: [quest.id],
        description: `Completing Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.complete(quest.id);
        },
      });
      handleStateUpdate(tx, true);
    };

    if (!quest) return <></>;

    return (
      <ModalWrapper
        id='questDialogue'
        header={<Header>{quest?.name}</Header>}
        canExit
        backgroundColor={`#f8f6e4`}
        noScroll
      >
        <Dialogue
          isModalOpen={isModalOpen}
          text={quest.description.replace(/\n+/g, '\n')}
          color='#5e4a14ff'
          isComplete={quest.complete}
          completionText={quest?.descriptionAlt?.replace(/\n+/g, '\n')}
        />
        <Bottom
          color='#5e4a14ff'
          buttons={{
            AcceptButton: {
              backgroundColor: '#f8f6e4',
              onClick: () => acceptQuest(quest),
              disabled: quest.startTime !== 0,
              label: 'Accept',
            },
            CompleteButton: {
              backgroundColor: '#f8f6e4',
              onClick: () => completeQuest(quest),
              disabled: !meetsObjectives(quest) || quest.complete || quest.startTime === 0,
              label: 'Complete',
            },
          }}
        />
      </ModalWrapper>
    );
  },
};

const Header = styled.div`
  border-color: white;
  padding: 0.7vw 1vw 0.2vw 1vw;
  width: 95%;

  font-size: 1.4vw;
  font-weight: bold;
  line-height: 2vw;
`;
