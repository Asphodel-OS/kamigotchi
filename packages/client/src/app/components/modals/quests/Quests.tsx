import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { questsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import {
  Quest,
  filterQuestsByAvailable,
  filterQuestsByObjective,
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
import { getDescribedEntity } from 'network/shapes/utils/parse';
import { Footer } from './Footer';
import { List } from './list/List';
import { Tabs } from './Tabs';

export function registerQuestsModal() {
  registerUIComponent(
    'Quests',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },

    (layers) =>
      interval(3000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, {
            kamis: true,
            inventory: true,
          });

          const registry = queryRegistryQuests(components).map((entityIndex) =>
            getBaseQuest(world, components, entityIndex)
          );
          const completed = queryCompletedQuests(components, account.id).map((entityIndex) =>
            getBaseQuest(world, components, entityIndex)
          );
          const ongoing = queryOngoingQuests(components, account.id).map((entityIndex) =>
            getBaseQuest(world, components, entityIndex)
          );

          return {
            network,
            data: {
              account,
              quests: {
                registry,
                ongoing,
                completed,
              },
            },
            utils: {
              describeEntity: (type: string, index: number) =>
                getDescribedEntity(world, components, type, index),
              getBase: (entityIndex: EntityIndex) => getBaseQuest(world, components, entityIndex),
              filterByAvailable: (
                registry: BaseQuest[],
                ongoing: BaseQuest[],
                completed: BaseQuest[]
              ) =>
                filterQuestsByAvailable(world, components, account, registry, ongoing, completed),
              filterByObjective: (quests: Quest[]) => filterQuestsByObjective(quests, 1),
              parseObjectives: (quest: Quest) =>
                parseQuestObjectives(world, components, account, quest),
              parseRequirements: (quest: Quest) =>
                parseQuestRequirements(world, components, account, quest),
              parseStatus: (quest: Quest) => parseQuestStatus(world, components, account, quest),
              populate: (base: BaseQuest) => populateQuest(world, components, base),
            },
          };
        })
      ),
    ({ network, data, utils }) => {
      const { actions, api, notifications } = network;
      const { account, quests } = data;
      const { ongoing, completed, registry } = quests;
      const { populate, filterByAvailable } = utils;
      const { modals } = useVisibility();

      const [tab, setTab] = useState<TabType>('ONGOING');
      const [available, setAvailable] = useState<Quest[]>([]);

      /////////////////
      // SUBSCRIPTIONS

      // update Available Quests alongside the Registry whenever quests are
      // added/removed. also respond to updates in Ongoing/Completed Quests
      // TODO: figure out a trigger for repeatable quests
      useEffect(() => {
        const newAvailable = filterByAvailable(registry, ongoing, completed);
        if (available.length != newAvailable.length) {
          setAvailable(newAvailable.map((q) => populate(q)));
        }
      }, [modals.quests, registry.length, completed.length, ongoing.length]);

      // update the Notifications when the number of available quests changes
      useEffect(() => {
        updateNotifications();
      }, [available.length]);

      /////////////////
      // HELPERS

      // Q(jb): do we want this in a react component or on an independent hook?
      const updateNotifications = () => {
        const id = 'Available Quests';
        const numAvail = available.length;
        if (available.length > 0) setTab('AVAILABLE');

        if (notifications.has(id as EntityID)) {
          if (numAvail == 0) notifications.remove(id as EntityID);
          notifications.update(id as EntityID, {
            description: `There ${numAvail == 1 ? 'is' : 'are'} ${numAvail} quest${
              numAvail == 1 ? '' : 's'
            } you can accept.`,
          });
        } else {
          if (numAvail > 0)
            notifications.add({
              id: id as EntityID,
              title: `Available Quest${numAvail == 1 ? '' : 's'}!`,
              description: `There ${numAvail == 1 ? 'is' : 'are'} ${numAvail} quest${
                numAvail == 1 ? '' : 's'
              } you can accept.`,
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
          description: `Accepting Quest ${quest.index * 1}`,
          execute: async () => {
            return api.player.quests.accept(quest.index);
          },
        });
      };

      const completeQuest = async (quest: BaseQuest) => {
        actions.add({
          action: 'QuestComplete',
          params: [quest.id],
          description: `Completing Quest ${quest.index * 1}`,
          execute: async () => {
            return api.player.quests.complete(quest.id);
          },
        });
      };

      return (
        <ModalWrapper
          id='quests'
          header={[
            <ModalHeader key='header' title='Quests' icon={questsIcon} />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          footer={
            <Footer
              account={account}
              quests={{
                registry: registry,
                ongoing: ongoing,
                completed: completed,
              }}
              actions={{ acceptQuest, completeQuest }}
              utils={utils}
            />
          }
          canExit
          truncate
          noPadding
        >
          <List
            quests={{ available, ongoing, completed }}
            mode={tab}
            actions={{ acceptQuest, completeQuest }}
            utils={utils}
          />
        </ModalWrapper>
      );
    }
  );
}
