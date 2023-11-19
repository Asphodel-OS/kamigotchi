import { EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Item } from "layers/react/shapes/Item";
import { Objective, Quest, Requirement, Reward } from "layers/react/shapes/Quest";
import { Room } from "layers/react/shapes/Room";


interface Props {
  account: Account;
  registryQuests: Quest[];
  mode: TabType;
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
  utils: {
    queryItemRegistry: (index: number) => EntityIndex;
    queryFoodRegistry: (index: number) => EntityIndex;
    queryReviveRegistry: (index: number) => EntityIndex;
    getItem: (index: EntityIndex) => Item;
    getRoom: (location: number) => Room;
    getQuestByIndex: (index: number) => Quest | undefined;
  };
}

export const List = (props: Props) => {
  // ticking
  // ticking
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);


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
    return account.quests?.ongoing.some((q: Quest) => q.index === questIndex) ?? false;
  }

  const meetsMax = (account: Account, quest: Quest): boolean => {
    return (isOngoing(account, quest.index) ? 1 : 0) + getNumCompleted(account, quest.index) < 1;
  }

  const meetsRepeat = (quest: Quest): boolean => {
    const allQuests = props.account.quests?.ongoing.concat(props.account.quests?.completed);
    const curr = allQuests?.find((x) => (x.index == quest.index));

    // has not accepted repeatable before
    if (curr === undefined) return true;

    // must be repeatable (should not get here)
    if (!quest.repeatable) return false;

    // must be completed
    if (!curr.complete) return false;


    const now = lastRefresh / 1000;
    const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
    return Number(curr.startTime) + Number(wait) <= Number(now);
  }


  // TODO: convert to TextBool
  const meetsRequirements = (quest: Quest): boolean => {
    for (const requirement of quest.requirements) {
      if (!requirement.status?.completable) {
        return false;
      }
    }

    return true;
  }

  // TODO: convert to TextBool
  const meetsObjectives = (quest: Quest): boolean => {
    for (const objective of quest.objectives) {
      if (!objective.status?.completable) {
        return false;
      }
    }

    return true;
  }

  const canAccept = (quest: Quest): boolean => {
    if (quest.repeatable) return meetsRepeat(quest) && meetsRequirements(quest);
    if (!meetsMax(props.account, quest)) return false;
    return meetsRequirements(quest);
  }

  const canComplete = (quest: Quest): boolean => {
    return meetsObjectives(quest);
  }


  /////////////////
  // INTERPRETATION

  const getNumCompleted = (account: Account, questIndex: number): number => {
    let ongoing = 0;
    account.quests?.completed.forEach((q: Quest) => {
      if (q.index === questIndex) ongoing++;
    });
    return ongoing;
  }

  const getItemName = (itemIndex: number): string => {
    let entityIndex = props.utils.queryItemRegistry(Number(itemIndex));
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name ? registryObject.name : `Item ${itemIndex}`;
  }

  const getFoodName = (foodIndex: number): string => {
    let entityIndex = props.utils.queryItemRegistry(foodIndex);
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name ? registryObject.name : `Food ${foodIndex}`;
  }

  const getReviveName = (reviveIndex: number): string => {
    let entityIndex = props.utils.queryReviveRegistry(reviveIndex);
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name ? registryObject.name : `Revive ${reviveIndex}`;
  }

  const getRepeatText = (quest: Quest): string => {
    const allQuests = props.account.quests?.ongoing.concat(props.account.quests?.completed);
    const curr = allQuests?.find((x) => (x.index == quest.index));

    // has not accepted repeatable before
    if (curr === undefined) return '';

    // must be repeatable (should not get here)
    if (!quest.repeatable) return 'not repeatable';

    // must be completed
    if (curr === undefined || !curr.complete) return 'already ongoing';

    const now = lastRefresh / 1000;
    const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
    if (Number(curr.startTime) + Number(wait) > Number(now)) {
      const timeLeft = Number(curr.startTime) + Number(wait) - Number(now);
      let timeText = '';
      if (timeLeft > 3600) {
        const hours = Math.floor(timeLeft / 3600);
        timeText = `${hours} ${hours > 1 ? 'hours' : 'hour'} `;
      }
      if (timeLeft > 60) {
        const mins = Math.floor((timeLeft % 3600) / 60);
        timeText = timeText + `${mins} ${mins > 1 ? 'minutes' : 'minute'} `;
      }
      const seconds = Math.ceil(timeLeft % 60);
      timeText = timeText + `${seconds} ${seconds > 1 ? 'seconds' : 'second'}`;
      return `repeats in ${timeText}`;
    } else {
      return '';
    }
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
      case 'QUEST':
        text = `Complete Quest [${props.utils.getQuestByIndex(requirement.target.value!)
          ? props.utils.getQuestByIndex(requirement.target.value!)?.name
          : requirement.target.value! * 1
          }]`;
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
      case 'ITEM':
        return `${reward.target.value! * 1} ${getItemName(reward.target.index!)}`;
      case 'EXPERIENCE':
        return `${reward.target.value! * 1} Experience`;
      case 'MINT20':
        return `${reward.target.value! * 1} $KAMI`;
      default:
        return '???';
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

    if (quest.repeatable) {
      const result = meetsRepeat(quest);
      if (!result) {
        tooltipText = getRepeatText(quest);
      }
    }

    if (!meetsRequirements(quest)) {
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
    if (!meetsObjectives(quest)) {
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

  const AvailableQuests = () => {
    // get available, non-repeatable quests from registry
    const oneTimes = props.registryQuests.filter((q: Quest) => {
      return (
        meetsRequirements(q)
        && meetsMax(props.account, q)
        && !q.repeatable
      );
    });

    // get available, repeatable quests from registry
    const repeats = props.registryQuests.filter((q: Quest) => {
      return (
        meetsRequirements(q)
        && q.repeatable
        && meetsRepeat(q)
      );
    });

    const quests = repeats.concat(oneTimes);

    if (quests.length == 0)
      return <EmptyText>No available quests. Do something else.</EmptyText>;

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
    let quests = [...props.account.quests?.completed ?? []];

    const line = (quests.length > 0) ? (
      <ConditionName
        style={{
          color: "#BBB",
          width: "100%",
          textAlign: "center",
          padding: "0.5vw",
        }}>
        - Completed -
      </ConditionName>
    ) : (
      <div />
    );

    return <div>
      {line}
      {quests.map((q: Quest) => (
        <DoneContainer key={q.id}>
          <QuestName>{q.name}</QuestName>
          <QuestDescription>{q.description}</QuestDescription>
          {ObjectiveDisplay(q.objectives, false)}
          {RewardDisplay(q.rewards)}
        </DoneContainer>
      ))}
    </div>

  }

  const OngoingQuests = () => {
    const rawQuests = [...props.account.quests?.ongoing ?? []];

    if (rawQuests.length == 0)
      return <EmptyText>No ongoing quests. Get a job?</EmptyText>;

    rawQuests.reverse();

    const completable: Quest[] = [];
    const uncompletable: Quest[] = [];
    rawQuests.forEach((q: Quest) => {
      if (canComplete(q)) completable.push(q);
      else uncompletable.push(q);
    });
    const quests = completable.concat(uncompletable);

    return (<div>
      {quests.map((q: Quest) => (
        <QuestContainer key={q.id}>
          <QuestName>{q.name}</QuestName>
          <QuestDescription>{q.description}</QuestDescription>
          {ObjectiveDisplay(q.objectives, true)}
          {RewardDisplay(q.rewards)}
          {CompleteButton(q)}
        </QuestContainer>
      ))}
      {CompletedQuests()}
    </div>);
  }

  const QuestsDisplay = () => {
    if (props.mode == 'AVAILABLE')
      return AvailableQuests();
    else if (props.mode == 'ONGOING')
      return OngoingQuests();
    else
      return <div />;
  }

  return <Container>{QuestsDisplay()}</Container>;
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  margin: 1.5vh;

  height: 100%;
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

  color: #333;
`;

const QuestName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0.7vh 0vw;
`;

const QuestDescription = styled.div`
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
  padding: 0vw 0vw 0.3vw 0vw;
`;

const ConditionDescription = styled.div`
  font-family: Pixel;
  text-align: left;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;

const DoneContainer = styled(QuestContainer)`
  border-color: #999;
  border-width: 1.5px;
  color: #BBB;
`;
