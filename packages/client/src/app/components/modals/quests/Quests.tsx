import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { questsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import {
  Quest,
  filterQuestsByAvailable,
  filterQuestsByObjective,
  getCompletedQuests,
  getOngoingQuests,
  getRegistryQuests,
  parseQuestStatuses,
} from 'network/shapes/Quest';
import { getDescribedEntity } from 'network/shapes/utils/parse';
import { Footer } from './Footer';
import { List } from './List';
import { Tabs } from './Tabs';

const REFRESH_PERIOD = 1000;

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
      interval(REFRESH_PERIOD).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, {
            kamis: true,
            inventory: true,
          });

          // NOTE(jb): ideally we only update when these shapes change but for
          // the time being we'll update on every tick to force a re-render.
          // just separating these out to flatten our Account shapes
          // TODO: move inside effect hook once we have proper Objective/Requirements tracking
          const registryQuests = getRegistryQuests(world, components);
          const registryParsed = parseQuestStatuses(world, components, account, registryQuests);
          const ongoingQuests = getOngoingQuests(world, components, account.id);
          const completedQuests = getCompletedQuests(world, components, account.id);
          const ongoingParsed = parseQuestStatuses(world, components, account, ongoingQuests);
          const completedParsed = parseQuestStatuses(world, components, account, completedQuests);
          const availableQuests = filterQuestsByAvailable(
            registryParsed,
            completedParsed,
            ongoingParsed
          );

          return {
            network,
            data: {
              account,
              registry: registryParsed,
              available: availableQuests,
              ongoing: ongoingParsed,
              completed: completedParsed,
            },
          };
        })
      ),
    ({ network, data }) => {
      const { actions, api, components, notifications, world } = network;
      const { account, available, completed, ongoing, registry } = data;
      const [tab, setTab] = useState<TabType>('ONGOING');

      /////////////////
      // SUBSCRIPTIONS

      // update the Notifications when the number of available quests changes
      // Q(jb): do we want this in a react component or on an independent hook?
      useEffect(() => {
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
      }, [available.length]);

      // const refreshAvailable = (
      //   account: Account,
      //   registry: Quest[],
      //   completed: Quest[],
      //   ongoing: Quest[]
      // ) => {
      //   const parsedRegistry = parseQuestStatuses(world, components, account, registry);
      //   const availableQuests = filterQuestsByAvailable(parsedRegistry, completed, ongoing);
      //   setAvailable(availableQuests);
      // };

      // const refreshAfterAction = async (actionIndex: EntityIndex) => {
      //   await waitForActionCompletion(actions!.Action, actionIndex);
      //   setTimeout(() => {
      //     refreshAvailable(account, registry, completed, ongoing);
      //   }, REFRESH_PERIOD + 500);
      // };

      /////////////////
      // ACTIONS

      const acceptQuest = async (quest: Quest) => {
        actions.add({
          action: 'QuestAccept',
          params: [quest.index * 1],
          description: `Accepting Quest ${quest.index * 1}`,
          execute: async () => {
            return api.player.quests.accept(quest.index);
          },
        });
      };

      const completeQuest = async (quest: Quest) => {
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
                agency: filterQuestsByObjective(registry, 1),
                ongoing: filterQuestsByObjective(ongoing, 1),
                completed: filterQuestsByObjective(completed, 1),
              }}
              actions={{ acceptQuest, completeQuest }}
            />
          }
          canExit
          truncate
          noPadding
        >
          <List
            quests={{ available, ongoing: ongoing, completed: completed }}
            mode={tab}
            actions={{ acceptQuest, completeQuest }}
            utils={{
              getDescribedEntity: (type: string, index: number) =>
                getDescribedEntity(world, components, type, index),
            }}
          />
        </ModalWrapper>
      );
    }
  );
}
