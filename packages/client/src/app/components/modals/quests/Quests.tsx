import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { questsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import {
  Quest,
  filterAvailableQuests,
  getCompletedQuests,
  getOngoingQuests,
  getRegistryQuests,
  parseQuestStatuses,
} from 'network/shapes/Quest';
import { getDescribedEntity } from 'network/shapes/utils/parse';
import { Footer } from './Footer';
import { List } from './List';
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
      interval(1000).pipe(
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
          // TODO (jb): move inside effect hook once we have proper subscriptions
          const ongoingQuests = getOngoingQuests(world, components, account.id);
          const completedQuests = getCompletedQuests(world, components, account.id);
          const ongoingParsed = parseQuestStatuses(world, components, account, ongoingQuests);
          const completedParsed = parseQuestStatuses(world, components, account, completedQuests);

          return {
            network,
            data: {
              account,
              ongoing: ongoingParsed,
              completed: completedParsed,
              registry: getRegistryQuests(world, components),
            },
          };
        })
      ),
    ({ network, data }) => {
      const { actions, api, components, notifications, world } = network;
      const [tab, setTab] = useState<TabType>('ONGOING');
      const { modals } = useVisibility();
      const [available, setAvailable] = useState<Quest[]>([]);

      /////////////////
      // SUBSCRIPTIONS

      // update the State-based (Parsed) Quest Registry when we detect a change
      // in the Props-based (UnParsed) Quest Registry. recheck the number of
      // available quests for the Notification bar as well
      useEffect(() => {
        const parsedRegistry = parseQuestStatuses(world, components, data.account, data.registry);
        const availableQuests = filterAvailableQuests(parsedRegistry, data.completed, data.ongoing);

        if (availableQuests.length > 0) setTab('AVAILABLE');
        setAvailable(availableQuests);
      }, [data.registry.length, modals.quests]);

      // update the Notifications when the number of available quests changes
      useEffect(() => {
        const id = 'Available Quests';
        const numAvail = available.length;

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
          footer={<Footer balance={data.account.reputation.agency} />}
          canExit
          truncate
          noPadding
        >
          <List
            quests={{ available, ongoing: data.ongoing, completed: data.completed }}
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
