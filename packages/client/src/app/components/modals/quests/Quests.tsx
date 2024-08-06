import { EntityID } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { questsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'network/shapes/Account';
import {
  Quest,
  filterAvailableQuests,
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
            quests: true,
            kamis: true,
            inventory: true,
          });

          return {
            network,
            data: {
              account,
              registry: getRegistryQuests(world, components),
            },
          };
        })
      ),
    ({ network, data }) => {
      const { actions, api, components, notifications, world } = network;
      const [tab, setTab] = useState<TabType>('ONGOING');
      const [registry, setRegistry] = useState<Quest[]>([]);
      const [numAvail, setNumAvail] = useState(0);

      // update the State-based (Parsed) Quest Registry when we detect a change
      // in the Props-based (UnParsed) Quest Registry. recheck the number of
      // available quests for the Notification bar as well
      useEffect(() => {
        const parsedRegistry = parseQuestStatuses(world, components, data.account, data.registry);
        const availableQuests = filterAvailableQuests(parsedRegistry, data.account);
        setRegistry(parsedRegistry);
        setNumAvail(availableQuests.length);
      }, [data.registry.length]);

      // update the Notifications when the number of available quests changes
      useEffect(() => {
        const id = 'Available Quests';
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
      }, [numAvail]);

      ///////////////////
      // INTERACTIONS

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
        >
          <List
            account={data.account}
            registry={registry}
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
