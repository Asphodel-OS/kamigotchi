import { EntityID, EntityIndex } from 'engine/recs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getItemByIndex } from 'app/cache/item';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useVisibility } from 'app/stores';
import { QuestsIcon } from 'assets/images/icons/menu';
import { DEAD_ADDRESS } from 'constants/addresses';
import { getAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getItemBalance as _getItemBalance } from 'network/shapes/Item';
import {
  Quest,
  filterQuestsByAvailable,
  getBaseQuest,
  parseQuestObjectives,
  parseQuestRequirements,
  parseQuestStatus,
  populateQuest,
  queryCompletedQuests,
  queryOngoingQuests,
  queryRegistryQuests,
} from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { getFromDescription } from 'network/shapes/utils/parse';
import { useComponentEntities } from 'network/utils/hooks';
import { List } from './list/List';
import { Tabs } from './Tabs';

export const QuestModal: UIComponent = {
  id: 'QuestModal',
  Render: () => {
    const layers = useLayers();
    const { burnerAddress, validations } = useNetwork();
    const isNetworkReady =
      validations.authenticated && validations.chainMatches && burnerAddress !== DEAD_ADDRESS;

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
          describeEntity: (type: string, index: number) =>
            getFromDescription(world, components, type, index),
          getBase: (entity: EntityIndex) => getBaseQuest(world, components, entity),
          getItem: (index: number) => getItemByIndex(world, components, index),
          getItemBalance: (index: number) => _getItemBalance(world, components, account.id, index),
          filterByAvailable: (
            registry: BaseQuest[],
            ongoing: BaseQuest[],
            completed: BaseQuest[]
          ) => filterQuestsByAvailable(world, components, account, registry, ongoing, completed),
          parseObjectives: (quest: Quest) =>
            parseQuestObjectives(world, components, account, quest),
          parseRequirements: (quest: Quest) =>
            parseQuestRequirements(world, components, account, quest),
          parseStatus: (quest: Quest) => parseQuestStatus(world, components, account, quest),
          populate: (base: BaseQuest) => populateQuest(world, components, base),
          queryRegistry: () => queryRegistryQuests(components),
          queryOngoing: () => queryOngoingQuests(components, account.id),
          queryCompleted: () => queryCompletedQuests(components, account.id),
        },
      };
    })();

    const { actions, api, components, notifications } = network;
    const { IsRegistry, OwnsQuestID, IsComplete } = components;
    const { accountEntity, account } = data;
    const { getBase, getItem, filterByAvailable, populate } = utils;
    const { queryRegistry, queryOngoing, queryCompleted } = utils;
    const questsModalVisible = useVisibility((s) => s.modals.quests);

    const isUpdating = useRef(false);
    const [tab, setTab] = useState<TabType>('ONGOING');
    const [available, setAvailable] = useState<Quest[]>([]);

    // Reactively subscribe to ECS changes relevant to quests
    const registryEntities = useComponentEntities(IsRegistry) || [];
    const ownsQuestEntities = useComponentEntities(OwnsQuestID) || [];
    const isCompleteEntities = useComponentEntities(IsComplete) || [];

    // Derive quest lists reactively from ECS streams

    const registry: BaseQuest[] = useMemo(() => {
      return queryRegistry().map((entity) => getBase(entity));
    }, [network, registryEntities]);

    const completed: BaseQuest[] = useMemo(() => {
      return queryCompleted().map((entity) => getBase(entity));
    }, [network, account.id, ownsQuestEntities, isCompleteEntities]);

    const ongoing: BaseQuest[] = useMemo(() => {
      return queryOngoing().map((entity) => getBase(entity));
    }, [network, account.id, ownsQuestEntities, isCompleteEntities]);

    /////////////////
    // SUBSCRIPTIONS

    // update Available Quests whenever quests change state
    // TODO: figure out a trigger for repeatable quests
    useEffect(() => {
      if (!isNetworkReady) return;
      if (isUpdating.current) return;
      isUpdating.current = true;

      const raw = filterByAvailable(registry, ongoing, completed);
      const populated = raw.map((q) => populate(q));

      setAvailable(populated);
      if (populated.length > available.length) setTab('AVAILABLE');

      isUpdating.current = false;
    }, [questsModalVisible, registry, completed, ongoing, isNetworkReady]);

    // update the Notifications when the number of available quests changes
    useEffect(() => {
      if (!isNetworkReady) return;
      updateNotifications();
    }, [available.length, isNetworkReady]);

    /////////////////
    // HELPERS

    // Q(jb): do we want this in a react component or on an independent hook?
    const updateNotifications = async () => {
      const id = 'Available Quests' as EntityID;
      const n = available.length;
      const auxVerb = n == 1 ? 'is' : 'are';
      const questWord = n == 1 ? 'quest' : 'quests';
      const description = `There ${auxVerb} ${n} ${questWord} you can accept.`;

      if (notifications.has(id)) {
        if (n == 0) notifications.remove(id as EntityID);
        else notifications.update(id as EntityID, { description });
      } else if (n > 0) {
        notifications.add({
          id,
          title: `Available Quests!`,
          description,
          time: Date.now().toString(),
          modal: 'quests',
        });
      }
    };

    /////////////////
    // ACTIONS

    const acceptQuest = async (quest: BaseQuest) => {
      actions.add({
        action: 'QuestAccept',
        params: [quest.index * 1],
        description: `Accepting Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.accept(quest.index);
        },
      });
    };

    const completeQuest = async (quest: BaseQuest) => {
      actions.add({
        action: 'QuestComplete',
        params: [quest.id],
        description: `Completing Quest: ${quest.name}`,
        execute: async () => {
          return api.player.account.quest.complete(quest.id);
        },
      });
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

    const transactions: QuestModalActions = {
      accept: acceptQuest,
      complete: completeQuest,
      burnItems: burnQuestItems,
    };

    return (
      <ModalWrapper
        id='quests'
        header={[
          <ModalHeader key='header' title='Quests' icon={QuestsIcon} />,
          <Tabs key='tabs' tab={tab} setTab={setTab} />,
        ]}
        canExit
        truncate
        noPadding
      >
        <List
          quests={{ available, ongoing, completed }}
          mode={tab}
          actions={transactions}
          utils={utils}
        />
      </ModalWrapper>
    );
  },
};
