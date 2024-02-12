import React, { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import crypto from 'crypto';

import { Footer } from './Footer';
import { List } from './List';
import { Tabs } from './Tabs';
import { questsIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import {
  Quest,
  getQuestByIndex,
  getRegistryQuests,
  parseQuestsStatus,
} from 'layers/network/shapes/Quest';
import {
  getItem,
  getItemByIndex,
  queryFoodRegistry,
  queryReviveRegistry,
} from 'layers/network/shapes/Item';
import { getRoomByLocation } from 'layers/network/shapes/Room';

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
          const account = getAccountFromBurner(network, {
            quests: true,
            kamis: true,
            inventory: true,
          });
          const quests = parseQuestsStatus(
            network,
            account,
            getRegistryQuests(network)
          );

          return {
            network,
            data: { account, quests },
          };
        })
      ),

    ({ network, data }) => {
      const { actions, api, notifications } = network;
      const [tab, setTab] = useState<TabType>('AVAILABLE');
      const [numAvail, setNumAvail] = useState(0);

      useEffect(() => {
        const id = 'Available Quests';
        if (notifications.has(id as EntityID)) {
          if (numAvail == 0) notifications.remove(id as EntityID);
          notifications.update(id as EntityID, {
            description: `There ${
              numAvail == 1 ? 'is' : 'are'
            } ${numAvail} quest${numAvail == 1 ? '' : 's'} you can accept.`,
          });
        } else {
          if (numAvail > 0)
            notifications.add({
              id: id as EntityID,
              title: `Available Quest${numAvail == 1 ? '' : 's'}!`,
              description: `There ${
                numAvail == 1 ? 'is' : 'are'
              } ${numAvail} quest${numAvail == 1 ? '' : 's'} you can accept.`,
              time: Date.now().toString(),
              modal: 'quests',
            });
        }
      }, [numAvail]);

      ///////////////////
      // INTERACTIONS

      const acceptQuest = async (quest: Quest) => {
        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
          action: 'QuestAccept',
          params: [quest.index * 1],
          description: `Accepting Quest ${quest.index * 1}`,
          execute: async () => {
            return api.player.quests.accept(quest.index);
          },
        });
      };

      const completeQuest = async (quest: Quest) => {
        const actionID = crypto.randomBytes(32).toString('hex') as EntityID;
        actions?.add({
          id: actionID,
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
              getItem: (index: EntityIndex) => getItem(network, index),
              getRoom: (location: number) =>
                getRoomByLocation(network, location),
              getQuestByIndex: (index: number) =>
                getQuestByIndex(network, index),
              queryItemRegistry: (index: number) =>
                getItemByIndex(network, index).entityIndex,
              queryFoodRegistry: (index: number) =>
                queryFoodRegistry(network, index),
              queryReviveRegistry: (index: number) =>
                queryReviveRegistry(network, index),
            }}
          />
        </ModalWrapper>
      );
    }
  );
}
