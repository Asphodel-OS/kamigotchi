import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';

import { questsIcon } from 'assets/images/icons/menu';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { getItem, getItemByIndex } from 'layers/network/shapes/Item';
import {
  Quest,
  getQuestByIndex,
  getRegistryQuests,
  parseQuestsStatus,
} from 'layers/network/shapes/Quest';
import { getRoomByIndex } from 'layers/network/shapes/Room';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
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
          const quests = parseQuestsStatus(
            world,
            components,
            account,
            getRegistryQuests(world, components)
          );

          return {
            network,
            data: { account, quests },
          };
        })
      ),
    ({ network, data }) => {
      const { actions, api, components, notifications, world } = network;
      const [tab, setTab] = useState<TabType>('AVAILABLE');
      const [numAvail, setNumAvail] = useState(0);

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
          id='quest_modal'
          divName='quests'
          header={[
            <ModalHeader key='header' title='Quests' icon={questsIcon} />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />,
          ]}
          footer={<Footer balance={data.account.questPoints} />}
          canExit
        >
          <List
            account={data.account}
            registryQuests={data.quests}
            mode={tab}
            actions={{ acceptQuest, completeQuest }}
            utils={{
              setNumAvail: (num: number) => setNumAvail(num),
              getItem: (index: EntityIndex) => getItem(world, components, index),
              getRoom: (roomIndex: number) => getRoomByIndex(world, components, roomIndex),
              getQuestByIndex: (index: number) => getQuestByIndex(world, components, index),
              queryItemRegistry: (index: number) =>
                getItemByIndex(world, components, index).entityIndex,
            }}
          />
        </ModalWrapper>
      );
    }
  );
}
