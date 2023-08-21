import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';

import { getAccount } from 'layers/react/shapes/Account';
import { Quest, Condition, queryQuestsX } from 'layers/react/shapes/Quest';
import { Inventory, queryInventoryX } from 'layers/react/shapes/Inventory';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

export function registerQuestsModal() {
  registerUIComponent(
    'Quests',
    {
      colStart: 69,
      colEnd: 100,
      rowStart: 52,
      rowEnd: 100,
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
      const [showCompleted, setShowCompleted] = useState(false);
      // temp: show registry for testing
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

      const getBalanceOf = (owner: EntityID, condition: Condition): number => {
        const type = condition.type;
        switch (type) {
          case 'COIN':
            // TODO
            return 0;
            break;
          case 'FUNG_INVENTORY':
            return queryInventoryX(
              layers,
              { owner: owner, itemIndex: condition.itemIndex }
            )[0]?.balance || 0;
            break;
        }

        return 0;
      }

      const checkCurrMin = (condition: Condition): boolean => {
        const accBal = getBalanceOf(data.account.id, condition);
        const conBal = condition.balance ? condition.balance : 0;
        return accBal <= conBal;
      }

      const checkCurrMax = (condition: Condition): boolean => {
        const accBal = getBalanceOf(data.account.id, condition);
        const conBal = condition.balance ? condition.balance : 0;
        return accBal >= conBal;
      }

      const checkDeltaMin = (quest: Quest, condition: Condition): boolean => {
        const oldBal = getBalanceOf(quest.id, condition);
        const currBal = getBalanceOf(data.account.id, condition);
        const delta = condition.balance ? condition.balance : 0;
        return delta <= currBal - oldBal;
      }

      const checkDeltaMax = (quest: Quest, condition: Condition): boolean => {
        const oldBal = getBalanceOf(quest.id, condition);
        const currBal = getBalanceOf(data.account.id, condition);
        const delta = condition.balance ? condition.balance : 0;
        return delta >= currBal - oldBal;
      }

      const checkCondition = (quest: Quest, condition: Condition): boolean => {
        switch (condition.logic) {
          case 'CURR_MIN':
            return checkCurrMin(condition);
            break;
          case 'CURR_MAX':
            return checkCurrMax(condition);
            break;
          case 'DELTA_MIN':
            return checkDeltaMin(quest, condition);
            break;
          case 'DELTA_MAX':
            return checkDeltaMax(quest, condition);
            break;
        }

        return false;
      }

      const checkRequirements = (quest: Quest): boolean => {
        for (const condition of quest.requirements) {
          if (!checkCondition(quest, condition)) {
            return false;
          }
        }

        return true;
      }

      const checkObjectives = (quest: Quest): boolean => {
        for (const condition of quest.objectives) {
          if (!checkCondition(quest, condition)) {
            return false;
          }
        }

        return true;
      }

      const canAccept = (quest: Quest): boolean => {
        return checkRequirements(quest);
      }

      const canComplete = (quest: Quest): boolean => {
        if (isCompleted(quest)) {
          return false;
        }
        return checkObjectives(quest);
      }

      ///////////////////
      // DISPLAY

      const AcceptButton = (quest: Quest) => {
        let tooltipText = '';
        if (!checkRequirements(quest)) {
          tooltipText = 'Unmet requirements';
        }

        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Tooltip text={[tooltipText]}>
              <ActionButton
                id={`complete-quest`}
                onClick={() => acceptQuest(quest)}
                text='Accept'
                disabled={!canAccept(quest)}
              />
            </Tooltip >
          </div>
        )
      };

      const CompleteButton = (quest: Quest) => {
        let buttonText = 'Complete';
        if (quest.complete) buttonText = 'Completed!';

        let tooltipText = '';
        if (!checkObjectives(quest)) {
          tooltipText = 'Unmet objectives';
        }

        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Tooltip text={[tooltipText]}>
              <ActionButton
                id={`complete-quest`}
                onClick={() => completeQuest(quest)}
                text={buttonText}
                disabled={!canComplete(quest)}
              />
            </Tooltip >
          </div>
        )
      };

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

      const CompletedQuests = () => {
        return queryQuestsX(
          layers,
          { account: data.account.id, completed: true }
        ).reverse().map((q: Quest) => {
          return (QuestBox(q))
        });
      }

      const UncompletedQuests = () => {
        return queryQuestsX(
          layers,
          { account: data.account.id, completed: false }
        ).reverse().map((q: Quest) => {
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

      const Footer = (
        <div style={{ padding: '1vh 0.1vw' }}>
          <ActionButton
            id={`pending-mode`}
            onClick={() => setShowCompleted(false)}
            text='Pending'
          />
          <ActionButton
            id={`completed-mode`}
            onClick={() => setShowCompleted(true)}
            text='Completed'
          />
          <ActionButton
            id={`registry-mode`}
            onClick={() => setShowRegistry(!showRegistry)}
            text='Toggle Registry'
          />
        </div>
      )

      return (
        <ModalWrapperFull divName='quests' id='quest_modal'>
          <Header>Quests</Header>
          <Scrollable>
            {showRegistry ? RegistryQuestBoxes() : <div />}
            {showCompleted
              ? CompletedQuests()
              : UncompletedQuests()
            }
          </Scrollable>
          {Footer}
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