import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityIndex, EntityID, Has, HasValue, getComponentValue, runQuery } from '@latticexyz/recs';

import { getAccount } from 'layers/react/shapes/Account';
import { Quest, Condition, queryQuestsX } from 'layers/react/shapes/Quest';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';
import { set } from 'mobx';

export function registerQuestsModal() {
  registerUIComponent(
    'Quests',
    {
      colStart: 69,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 62,
    },

    (layers) => {
      const {
        network: {
          actions,
          api: { player },
          components: {
            AccountID,
            IsAccount,
            IsComplete,
            IsCondition,
            IsQuest,
            OperatorAddress,
            QuestIndex,
          },
          network,
        },
      } = layers;

      return merge(
        AccountID.update$,
        IsComplete.update$,
        IsQuest.update$,
        IsCondition.update$,
        QuestIndex.update$,
      ).pipe(
        map(() => {
          // get the account through the account entity of the controlling wallet
          const accountIndex = Array.from(
            runQuery([
              Has(IsAccount),
              HasValue(OperatorAddress, {
                value: network.connectedAddress.get(),
              }),
            ])
          )[0];

          const account = getAccount(layers, accountIndex, { quests: true });

          return {
            layers,
            actions,
            api: player,
            data: { account },
          };
        })
      );
    },

    ({ layers, actions, api, data }) => {
      ///////////////////
      // TEMP - REGISTRY ACCEPTANCE
      const [showRegistry, setShowRegistry] = useState(true);

      ///////////////////
      // INTERACTIONS

      const acceptQuest = async (quest: Quest) => {
        const actionID = `Accepting Quest ` as EntityID; // Date.now to have the actions ordered in the component browser
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
        const actionID = `Completing Quest ` as EntityID; // Date.now to have the actions ordered in the component browser
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

      ///////////////////
      // LOGIC

      const isCompleted = (quest: Quest) => {
        return quest.complete;
      }

      const canAccept = (quest: Quest): boolean => {
        return true;
      }

      const canComplete = (quest: Quest): boolean => {
        if (isCompleted(quest)) {
          return false;
        }
        return true;
      }


      ///////////////////
      // DISPLAY

      const AcceptButton = (quest: Quest) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <ActionButton
            id={`accept-quest`}
            onClick={() => acceptQuest(quest)}
            text='Accept'
            disabled={!canAccept(quest)}
          />
        </div>
      );

      const CompleteButton = (quest: Quest) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <ActionButton
            id={`complete-quest`}
            onClick={() => completeQuest(quest)}
            text='Complete'
            disabled={!canComplete(quest)}
          />
        </div>
      );

      const ConditionBox = (conditions: Condition[], conType: string) => {
        const texts = () => {
          return conditions.map((con) => (
            <QuestDescription>
              - {con.name}
            </QuestDescription>
          )
          )
        }

        return (
          <div>
            <ConditionName>
              {conditions.length > 0 ? conType : ''}
            </ConditionName>
            {texts()}
          </div>
        )
      }

      const QuestBox = (quest: Quest) => {
        return (
          <ProductBox>
            <QuestName>{quest.name}</QuestName>
            {ConditionBox(quest.objectives, 'Objectives')}
            {ConditionBox(quest.rewards, 'Rewards')}
            {CompleteButton(quest)}
          </ProductBox>
        )
      }

      const QuestBoxes = () => {
        const uncompleted = queryQuestsX(layers, { account: data.account.id, completed: false });
        const completed = queryQuestsX(layers, { account: data.account.id, completed: true });
        const all = [...uncompleted.reverse(), ...completed.reverse()];
        return all.map((q: Quest) => {
          return (QuestBox(q))
        });
      }

      const RegistryQuestBox = (quest: Quest) => {
        return (
          <ProductBox>
            <QuestName>[registry] {quest.name}</QuestName>
            {ConditionBox(quest.requirements, 'Requirements')}
            {ConditionBox(quest.objectives, 'Objectives')}
            {ConditionBox(quest.rewards, 'Rewards')}
            {AcceptButton(quest)}
          </ProductBox>
        )
      }

      const RegistryQuestBoxes = () => {
        const quests = queryQuestsX(layers, { registry: true })
        return quests.map((q: Quest) => {
          return (RegistryQuestBox(q))
        })
      }

      return (
        <ModalWrapperFull divName='quests' id='quest_modal'>
          <Header>Quests</Header>
          <Scrollable>
            {showRegistry ? RegistryQuestBoxes() : QuestBoxes()}
          </Scrollable>
          <div style={{ padding: '1vh 0.1vw' }}>
            <ActionButton
              id={`registry-mode`}
              onClick={() => setShowRegistry(true)}
              text='Registry'
            />
            <ActionButton
              id={`account-mode`}
              onClick={() => setShowRegistry(false)}
              text='Account'
            />
          </div>

        </ModalWrapperFull>
      );
    }
  );
}

const Header = styled.p`
  font-size: 24px;
  color: #333;
  text-align: left;
  padding: 1vh 0vw 0.5vh 0vw;
  font-family: Pixel;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100 %;
`;

const ProductBox = styled.div`
  border-color: black;
  border-radius: 2px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: start;
  align-items: start;
  flex-direction: column;
  padding: 1vh 1vw 0.5vh 1vw;
  margin: 0.8vh 0vw;
  width: 100%;
`;

const QuestName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0.4vh 0vw;
`;

const ConditionName = styled.div`
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0.3vh 0vw;
`;

const QuestDescription = styled.div`
  color: #333;
  flex-grow: 1;

  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.2vh 0vw;
`;