import React, { useState, useEffect, useCallback } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';
import { EntityID, Has, HasValue, runQuery } from '@latticexyz/recs';

import { getAccount } from 'layers/react/shapes/Account';
import {
  Quest,
  Objective,
  Reward,
  Requirement,
  queryQuestsX,
} from 'layers/react/shapes/Quest';
import { Inventory, queryInventoryX } from 'layers/react/shapes/Inventory';
import { getItem, queryFoodRegistry, queryReviveRegistry } from 'layers/react/shapes/Item';

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
            IsObjective,
            IsQuest,
            IsRequirement,
            IsReward,
            OperatorAddress,
            QuestIndex,
          },
          network,
        },
      } = layers;

      return merge(
        AccountID.update$,
        IsComplete.update$,
        IsObjective.update$,
        IsQuest.update$,
        IsRequirement.update$,
        IsReward.update$,
        IsObjective.update$,
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

    // we want three categories
    // 1. Available
    // 2. Ongoing
    // 3. Completed
    // NOTE: Completed and Ongoing should be straitforward to pull. we should
    // be using those + requirements to determine available quests
    ({ layers, actions, api, data }) => {
      console.log('mQuest:', data);
      const [showCompleted, setShowCompleted] = useState(false);
      // temp: show registry for testing
      const [showRegistry, setShowRegistry] = useState(true);

      ///////////////////
      // INTERACTIONS

      const acceptQuest = async (quest: Quest) => {
        const actionID = `Accepting Quest ${quest.index}` as EntityID; // Date.now to have the actions ordered in the component browser
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
        const actionID = `Completing Quest ${quest.index}` as EntityID; // Date.now to have the actions ordered in the component browser
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

      // const getBalanceOf = (owner: EntityID, condition: Condition): number => {
      //   const type = condition.type;
      //   switch (type) {
      //     case 'COIN':
      //       // TODO
      //       return 0;
      //       break;
      //     case 'FUNG_INVENTORY':
      //       return queryInventoryX(
      //         layers,
      //         { owner: owner, itemIndex: condition.itemIndex }
      //       )[0]?.balance || 0;
      //       break;
      //   }

      //   return 0;
      // }

      // // TODO: probably move these to Quest Conditions Shapes file
      // const checkCurrMin = (objective: Objective): boolean => {
      //   const accBal = getBalanceOf(data.account.id, objective);
      //   const conBal = objective.balance ? objective.balance : 0;
      //   return accBal <= conBal;
      // }

      // const checkCurrMax = (objective: Objective): boolean => {
      //   const accBal = getBalanceOf(data.account.id, objective);
      //   const conBal = objective.balance ? objective.balance : 0;
      //   return accBal >= conBal;
      // }

      // const checkDeltaMin = (quest: Quest, objective: Objective): boolean => {
      //   const oldBal = getBalanceOf(quest.id, objective);
      //   const currBal = getBalanceOf(data.account.id, objective);
      //   const delta = objective.balance ? objective.balance : 0;
      //   return delta <= currBal - oldBal;
      // }

      // const checkDeltaMax = (quest: Quest, objective: Objective): boolean => {
      //   const oldBal = getBalanceOf(quest.id, objective);
      //   const currBal = getBalanceOf(data.account.id, objective);
      //   const delta = objective.balance ? objective.balance : 0;
      //   return delta >= currBal - oldBal;
      // }

      // const checkCondition = (quest: Quest, objective: Objective): boolean => {
      //   switch (objective.logic) {
      //     case 'CURR_MIN':
      //       return checkCurrMin(objective);
      //     case 'CURR_MAX':
      //       return checkCurrMax(objective);
      //     case 'DELTA_MIN':
      //       return checkDeltaMin(quest, objective);
      //     case 'DELTA_MAX':
      //       return checkDeltaMax(quest, objective);
      //   }

      //   return false;
      // }

      // check that a quest's requirements are met by this account
      const checkRequirements = (quest: Quest): boolean => {
        for (const condition of quest.requirements) {
          // if (!checkCondition(quest, condition)) {
          //   return false;
          // }
        }

        return true;
      }

      // check that a quest's objectives are met by this account
      const checkObjectives = (quest: Quest): boolean => {
        for (const condition of quest.objectives) {
          // if (!checkCondition(quest, condition)) {
          //   return false;
          // }
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

      const getRewardText = (reward: Reward): string => {
        console.log(reward);
        switch (reward.target.type) {
          case 'COIN':
            return `${reward.target.value! * 1} $MUSU`;
          case 'EXPERIENCE':
            return `${reward.target.value! * 1} Experience`;
          case 'FOOD':
            let foodRegistryEntityIndex = queryFoodRegistry(layers, reward.target.index!);
            let foodObject = getItem(layers, foodRegistryEntityIndex);
            return `${reward.target.value! * 1} ${foodObject.name}`;
          case 'REVIVE':
            let reviveRegistryEntityIndex = queryReviveRegistry(layers, reward.target.index!);
            let reviveObject = getItem(layers, reviveRegistryEntityIndex);
            return `${reward.target.value! * 1} ${reviveObject.name}`;
        }
        return '';
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

      const RequirementDisplay = (requirements: Requirement[]) => {
        if (requirements.length == 0) return <div />;
        return (
          <ConditionContainer>
            <ConditionName>Requirements</ConditionName>
            {requirements.map((requirement) => (
              <ConditionDescription key={requirement.id}>
                - {requirement.target.type} {requirement.logic} {requirement.target.index} {requirement.target.value}
              </ConditionDescription>
            ))}
          </ConditionContainer>
        )
      }

      const ObjectiveDisplay = (objectives: Objective[]) => {
        if (objectives.length == 0) return <div />;
        return (
          <ConditionContainer>
            <ConditionName>Objectives</ConditionName>
            {objectives.map((objective) => (
              <ConditionDescription key={objective.id}>
                - {objective.name}
              </ConditionDescription>
            ))}
          </ConditionContainer>
        )
      }

      const RewardDisplay = (rewards: Reward[]) => {
        if (rewards.length == 0) return <div />;
        return (
          <ConditionContainer>
            <ConditionName>Rewards</ConditionName>
            {rewards.map((reward) => (
              <ConditionDescription key={reward.id}>
                - {`${getRewardText(reward)}`}
              </ConditionDescription>
            ))}
          </ConditionContainer>
        )
      }

      const QuestBox = (quest: Quest) => {
        return (
          <QuestContainer key={quest.id}>
            <QuestName>{quest.name}</QuestName>
            <QuestDescription>{quest.description}</QuestDescription>
            {ObjectiveDisplay(quest.objectives)}
            {RewardDisplay(quest.rewards)}
            {CompleteButton(quest)}
          </QuestContainer>
        )
      }

      const RegistryQuestBox = (quest: Quest) => {
        return (
          <QuestContainer key={quest.id}>
            <QuestName>{quest.name}</QuestName>
            <QuestDescription>{quest.description}</QuestDescription>
            {RequirementDisplay(quest.requirements)}
            {ObjectiveDisplay(quest.objectives)}
            {RewardDisplay(quest.rewards)}
            {AcceptButton(quest)}
          </QuestContainer>
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

      const OngoingQuests = () => {
        return queryQuestsX(
          layers,
          { account: data.account.id, completed: false }
        ).reverse().map((q: Quest) => {
          return (QuestBox(q))
        });
      }

      const RegistryQuestBoxes = () => {
        const quests = queryQuestsX(layers, { registry: true });
        console.log(quests);
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
              : OngoingQuests()
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
  max-height: 100%;
`;

const QuestContainer = styled.div`
  border-color: black;
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: start;
  align-items: start;
  flex-direction: column;
  padding: 1vw;
  margin: 0.8vw;

`;

const QuestName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0.7vh 0vw;
`;

const QuestDescription = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  line-height: 1.2vw;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;

const ConditionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 0.4vw 0.5vw;
`;

const ConditionName = styled.div`
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: left;
  justify-content: flex-start;
  color: #333;
  padding: 0vw 0vw 0.3vw 0vw;
`;

const ConditionDescription = styled.div`
  color: #333;

  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;