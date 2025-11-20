import { EntityIndex } from 'engine/recs';
import { useEffect, useState } from 'react';

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
import { didActionComplete } from 'network/utils';
import { useComponentEntities } from 'network/utils/hooks';
import styled from 'styled-components';
import { QuestDialogue } from './QuestDialogue';
const REFRESH_INTERVAL = 3333;

export const QuestDialogueModal: UIComponent = {
  id: 'QuestDialogue',
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

    const { actions, api, components, world } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const { getBase, populate, parseObjectives } = utils;

    const questDialogueOpen = useVisibility((s) => s.modals.questDialogue);
    const setModals = useVisibility((s) => s.setModals);
    const questIndex = useSelected((s) => s.questIndex);

    const [quest, setQuest] = useState<Quest>();
    const [modalOpen, setModalOpen] = useState(false);
    const [tick, setTick] = useState(Date.now());
    // Reactively subscribe to ECS changes relevant to quests
    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];

    /////////////////
    // SUBSCRIPTIONS

    // set data and setup ticking on mount
    useEffect(() => {
      const refreshClock = () => setTick(Date.now());
      const timerId = setInterval(refreshClock, REFRESH_INTERVAL);
      return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
      if (!questDialogueOpen) {
        setModalOpen(false);
        return;
      }
      if (questIndex == null) {
        setQuest(undefined);
        return;
      }
      setModalOpen(true);
      const base = getBase(questIndex);
      const populated = populate(base);
      const parsed = parseObjectives(populated);
      const filtered = filterOngoingQuests([parsed]);
      setQuest(filtered[0]);
    }, [
      tick,
      questIndex,
      questDialogueOpen,
      registryEntities,
      ownsQuestEntities,
      isCompleteEntities,
    ]);

    /////////////////
    // ACTIONS

    // always close modal after
    //Accet/Complete
    // except when there is
    // a completion text
    const handleClick = async (tx: EntityIndex, isComplete = false) => {
      const completed = await didActionComplete(actions.Action, tx);
      if (completed || (isComplete && !!quest?.descriptionAlt)) {
        setModals({ questDialogue: false });
      }
    };

    const acceptQuest = async (quest: BaseQuest) => {
      const tx = actions.add({
        action: 'QuestAccept',
        params: [quest.index * 1],
        description: `Accepting Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.accept(quest.index);
        },
      });
      handleClick(tx);
    };

    const completeQuest = async (quest: BaseQuest) => {
      const tx = actions.add({
        action: 'QuestComplete',
        params: [quest.id],
        description: `Completing Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.complete(quest.id);
        },
      });
      handleClick(tx, true);
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
        <QuestDialogue
          modalOpened={modalOpen}
          questText={quest.description.replace(/\n+/g, '\n')}
          questCompletion={
            quest?.descriptionAlt && quest.complete
              ? quest.descriptionAlt.replace(/\n+/g, '\n')
              : ''
          }
          questColor='#5e4a14ff'
          questButtons={{
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
  padding: 0.7vw 1vw 0.2vw 1vw;
  font-size: 1.4vw;
  color: #5e4a14ff;
  border-color: white;
  font-weight: bold;
  width: 95%;
  line-height: 2vw;
`;
