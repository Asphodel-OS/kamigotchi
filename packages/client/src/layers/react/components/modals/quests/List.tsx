import { EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Item } from "layers/react/shapes/Item";
import { Objective, Quest, Requirement, Reward } from "layers/react/shapes/Quest";


interface Props {
  account: Account;
  registryQuests: Quest[];
  mode: 'AVAILABLE' | 'ONGOING' | 'COMPLETED';
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
  utils: {
    queryFoodRegistry: (index: number) => EntityIndex;
    queryReviveRegistry: (index: number) => EntityIndex;
    getItem: (index: EntityIndex) => Item;
  };
  // quests: {
  //   available: Quest[];
  //   ongoing: Quest[];
  //   completed: Quest[];
  // }
}

export const List = (props: Props) => {


  ///////////////////
  // LOGIC

  const isCompleted = (account: Account, questIndex: number) => {
    let complete = false;
    account.quests?.completed.forEach((q: Quest) => {
      if (q.index === questIndex) complete = true;
    });
    return complete;
  }

  const isOngoing = (account: Account, questIndex: number): boolean => {
    let ongoing = false;
    account.quests?.ongoing.forEach((q: Quest) => {
      if (q.index === questIndex) ongoing = true;
    });
    return ongoing;
  }

  const checkRequirements = (quest: Quest): boolean => {
    for (const requirement of quest.requirements) {
      if (!requirement.status?.completable) {
        return false;
      }
    }

    return true;
  }

  const checkObjectives = (quest: Quest): boolean => {
    for (const objective of quest.objectives) {
      if (!objective.status?.completable) {
        return false;
      }
    }

    return true;
  }

  const canAccept = (quest: Quest): boolean => {
    return checkRequirements(quest);
  }

  const canComplete = (quest: Quest): boolean => {
    return checkObjectives(quest);
  }


  /////////////////
  // INTERPRETATION

  const getFoodName = (foodIndex: number): string => {
    let entityIndex = props.utils.queryFoodRegistry(foodIndex);
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name;
  }

  const getReviveName = (reviveIndex: number): string => {
    let entityIndex = props.utils.queryReviveRegistry(reviveIndex);
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name;
  }

  const getRequirementText = (requirement: Requirement, status: boolean): string => {
    let text = '';
    switch (requirement.target.type) {
      case 'COIN':
        text = `${requirement.target.value! * 1} $MUSU`;
        break;
      case 'LEVEL': // TODO: account for both min/max
        text = `Level ${requirement.target.value! * 1}`;
        break;
      case 'FOOD':
        text = `${requirement.target.value! * 1} ${getFoodName(requirement.target.index!)}`;
        break;
      case 'REVIVE':
        text = `${requirement.target.value! * 1} ${getReviveName(requirement.target.index!)}`;
        break;
      case 'QUEST':
        text = `Complete Quest ${requirement.target.value! * 1}`;
        break;
      default:
        text = '???';
    }

    if (status) {
      if (requirement.status?.completable) {
        text = text + ' ✅';
      } else {
        text = text + ` [${Number(requirement.status?.current)}/${Number(requirement.status?.target)}]`;
      }
    }

    return text;
  }

  const getRewardText = (reward: Reward): string => {
    switch (reward.target.type) {
      case 'COIN':
        return `${reward.target.value! * 1} $MUSU`;
      case 'EXPERIENCE':
        return `${reward.target.value! * 1} Experience`;
      case 'FOOD':
        return `${reward.target.value! * 1} ${getFoodName(reward.target.index!)}`;
      case 'REVIVE':
        return `${reward.target.value! * 1} ${getReviveName(reward.target.index!)}`;
      default:
        return '';
    }
  }

  const getObjectiveText = (objective: Objective, showTracking: boolean): string => {
    let text = objective.name;

    if (showTracking) {
      let tracking = '';
      if (objective.status?.completable) {
        tracking = ' ✅';
      } else {
        if (objective.target.type !== 'ROOM')
          tracking = ` [${objective.status?.current ?? 0}/${Number(objective.status?.target)}]`;
      }

      text += tracking;
    }

    return text;
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
            onClick={() => props.actions.acceptQuest(quest)}
            text='Accept'
            disabled={!canAccept(quest)}
          />
        </Tooltip >
      </div>
    )
  };

  const CompleteButton = (quest: Quest) => {
    let tooltipText = '';
    if (!checkObjectives(quest)) {
      tooltipText = 'Unmet objectives';
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Tooltip text={[tooltipText]}>
          <ActionButton
            id={`complete-quest`}
            onClick={() => props.actions.completeQuest(quest)}
            text='Complete'
            disabled={!canComplete(quest)}
          />
        </Tooltip >
      </div>
    )
  };

  const RequirementDisplay = (requirements: Requirement[]) => {
    if (requirements.length == 0) return <div />;
    return (
      <ConditionContainer key='requirements'>
        <ConditionName>Requirements</ConditionName>
        {requirements.map((requirement) => (
          <ConditionDescription key={requirement.id}>
            - {`${getRequirementText(requirement, true)}`}
          </ConditionDescription>
        ))}
      </ConditionContainer>
    )
  }

  const ObjectiveDisplay = (objectives: Objective[], showTracking: boolean) => {
    if (objectives.length == 0) return <div />;
    return (
      <ConditionContainer key='objectives'>
        <ConditionName>Objectives</ConditionName>
        {objectives.map((objective) => (
          <ConditionDescription key={objective.id}>
            - {`${getObjectiveText(objective, showTracking)}`}
          </ConditionDescription>
        ))}
      </ConditionContainer>
    )
  }

  const RewardDisplay = (rewards: Reward[]) => {
    if (rewards.length == 0) return <div />;
    return (
      <ConditionContainer key='rewards'>
        <ConditionName>Rewards</ConditionName>
        {rewards.map((reward) => (
          <ConditionDescription key={reward.id}>
            - {`${getRewardText(reward)}`}
          </ConditionDescription>
        ))}
      </ConditionContainer>
    )
  }

  // TODO: logical support for repeatable quests (e.g. daily quests)
  const AvailableQuests = () => {
    // get quest registry. filter out any unavailable quests
    let quests = props.registryQuests.filter((q: Quest) => {
      return (
        canAccept(q)
        && !isCompleted(props.account, q.index)
        && !isOngoing(props.account, q.index)
      );
    });

    return quests.map((q: Quest) => (
      <QuestContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {RequirementDisplay(q.requirements)}
        {ObjectiveDisplay(q.objectives, false)}
        {RewardDisplay(q.rewards)}
        {AcceptButton(q)}
      </QuestContainer>
    ))
  }

  const CompletedQuests = () => {
    return props.account.quests?.completed.reverse().map((q: Quest) => (
      <QuestContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {ObjectiveDisplay(q.objectives, false)}
        {RewardDisplay(q.rewards)}
      </QuestContainer>
    ))
  }

  const OngoingQuests = () => {
    return props.account.quests?.ongoing.reverse().map((q: Quest) => (
      <QuestContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {ObjectiveDisplay(q.objectives, true)}
        {RewardDisplay(q.rewards)}
        {CompleteButton(q)}
      </QuestContainer>
    ));
  }

  const QuestsDisplay = () => {
    switch (props.mode) {
      case 'AVAILABLE':
        return AvailableQuests();
      case 'ONGOING':
        return OngoingQuests();
      case 'COMPLETED':
        return CompletedQuests();
      default:
        return <div />;
    }
  }

  return <Container>{QuestsDisplay()}</Container>;
};

const Container = styled.div`
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