import React, { useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, EntityIndex } from '@latticexyz/recs';

import { List } from './List';
import { Tabs } from './Tabs';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import { getAccountFromBurner } from 'layers/react/shapes/Account';
import { Quest, getRegistryQuests, parseQuestsStatus } from 'layers/react/shapes/Quest';
import { getItem, queryFoodRegistry, queryReviveRegistry } from 'layers/react/shapes/Item';
import 'layers/react/styles/font.css';

export function registerQuestsModal() {
  registerUIComponent(
    'Quests',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 52,
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
      const [tab, setTab] = useState<TabType>('ONGOING');


      ///////////////////
      // INTERACTIONS

      const acceptQuest = async (quest: Quest) => {
        const actionID = `Accepting Quest ${quest.index * 1}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
          execute: async () => {
            return api.quests.accept(quest.index);
          },
        });
      }

      const completeQuest = async (quest: Quest) => {
        const actionID = `Completing Quest ${quest.index * 1}` as EntityID; // Date.now to have the actions ordered in the component browser
        actions.add({
          id: actionID,
          components: {},
          requirement: () => true,
          updates: () => [],
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
            <Header>Quests</Header>,
            <Tabs tab={tab} setTab={setTab} />
          ]}
        >
          <List
            account={data.account}
            registryQuests={data.quests}
            mode={tab}
            actions={{ acceptQuest, completeQuest }}
            utils={{
              getItem: (index: EntityIndex) => getItem(layers, index),
              queryFoodRegistry: (index: number) => queryFoodRegistry(layers, index),
              queryReviveRegistry: (index: number) => queryReviveRegistry(layers, index),
            }}
          />
        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.div`
  font-size: 2vw;
  color: #333;
  text-align: left;
  padding: 1vw;
  font-family: Pixel;
`;