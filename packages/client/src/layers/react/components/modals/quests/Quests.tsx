import React, { useState } from 'react';
import { map, merge } from 'rxjs';
import { EntityID, EntityIndex } from '@latticexyz/recs';
import crypto from "crypto";

import { List } from './List';
import { Tabs } from './Tabs';
import { questsIcon } from 'assets/images/icons/menu';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Quest, getRegistryQuests, parseQuestsStatus } from 'layers/react/shapes/Quest';
import { getItem, getItemByIndex, queryFoodRegistry, queryReviveRegistry } from 'layers/react/shapes/Item';
import 'layers/react/styles/font.css';


export function registerQuestsModal() {
  registerUIComponent(
    'Quests',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 25,
      rowEnd: 99,
    },

    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            AccountID,
            Coin,
            IsComplete,
            IsObjective,
            IsQuest,
            IsRequirement,
            IsReward,
            Location,
            QuestIndex,
            Value,
          },
        },
      } = layers;

      return merge(
        AccountID.update$,
        Coin.update$,
        IsComplete.update$,
        IsObjective.update$,
        IsQuest.update$,
        IsRequirement.update$,
        IsReward.update$,
        IsObjective.update$,
        Location.update$,
        QuestIndex.update$,
        Value.update$,
      ).pipe(
        map(() => {
          const account = getAccountFromBurner(
            layers,
            { quests: true, kamis: true, inventory: true },
          );

          return {
            layers,
            actions,
            api: player,
            data: {
              account,
              quests: parseQuestsStatus(layers, account, getRegistryQuests(layers)),
            },
          };
        })
      );
    },

    ({ layers, actions, api, data }) => {
      // console.log('mQuest:', data);
      const [tab, setTab] = useState<TabType>('AVAILABLE');


      ///////////////////
      // INTERACTIONS

      const acceptQuest = async (quest: Quest) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'QuestAccept',
          params: [quest.index],
          description: `Accepting Quest ${quest.index * 1}`,
          execute: async () => {
            return api.quests.accept(quest.index);
          },
        });
      }

      const completeQuest = async (quest: Quest) => {
        const actionID = crypto.randomBytes(32).toString("hex") as EntityID;
        actions?.add({
          id: actionID,
          action: 'QuestComplete',
          params: [quest.id],
          description: `Completing Quest ${quest.index * 1}`,
          execute: async () => {
            return api.quests.complete(quest.id);
          },
        });
      }

      return (
        <ModalWrapperFull
          id='quest_modal'
          divName='quests'
          header={[
            <ModalHeader key='header' title='Quests' icon={questsIcon} />,
            <Tabs key='tabs' tab={tab} setTab={setTab} />
          ]}
          canExit
        >
          <List
            account={data.account}
            registryQuests={data.quests}
            mode={tab}
            actions={{ acceptQuest, completeQuest }}
            utils={{
              getItem: (index: EntityIndex) => getItem(layers, index),
              queryItemRegistry: (index: number) => getItemByIndex(layers, index).entityIndex,
              queryFoodRegistry: (index: number) => queryFoodRegistry(layers, index),
              queryReviveRegistry: (index: number) => queryReviveRegistry(layers, index),
            }}
          />
        </ModalWrapperFull>
      );
    }
  );
}