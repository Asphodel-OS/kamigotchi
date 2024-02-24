import { EntityIndex } from '@latticexyz/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'layers/network/shapes/Account';
import { Item } from 'layers/network/shapes/Item';
import { Objective, Quest, Requirement, Reward } from 'layers/network/shapes/Quest';
import { Room } from 'layers/network/shapes/Room';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Tooltip } from 'layers/react/components/library/Tooltip';

interface Props {
  account: Account;
  registryQuests: Quest[];
  mode: TabType;
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
  utils: {
    setNumAvail: (num: number) => void;
    queryItemRegistry: (index: number) => EntityIndex;
    getItem: (index: EntityIndex) => Item;
    getRoom: (roomIndex: number) => Room;
    getQuestByIndex: (index: number) => Quest | undefined;
  };
}

export const List = (props: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  // set the number of available quests whenever the registry or account quests are updated
  useEffect(() => {
    props.utils.setNumAvail(getAvailableQuests().length);
  }, [props.registryQuests.length, props.account.quests?.ongoing.length]);

  ///////////////////
  // LOGIC

  const isCompleted = (account: Account, questIndex: number) => {
    let complete = false;
    account.quests?.completed.forEach((q: Quest) => {
      if (q.index === questIndex) complete = true;
    });
    return complete;
  };

  const isOngoing = (account: Account, questIndex: number): boolean => {
    return account.quests?.ongoing.some((q: Quest) => q.index === questIndex) ?? false;
  };

  const meetsMax = (account: Account, quest: Quest): boolean => {
    return (isOngoing(account, quest.index) ? 1 : 0) + getNumCompleted(account, quest.index) < 1;
  };

  const meetsRepeat = (quest: Quest): boolean => {
    const allQuests = props.account.quests?.ongoing.concat(props.account.quests?.completed);
    const curr = allQuests?.find((x) => x.index == quest.index);

    // has not accepted repeatable before
    if (curr === undefined) return true;

    // must be repeatable (should not get here)
    if (!quest.repeatable) return false;

    // must be completed
    if (!curr.complete) return false;

    const now = lastRefresh / 1000;
    const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
    return Number(curr.startTime) + Number(wait) <= Number(now);
  };

  // TODO: convert to TextBool
  const meetsRequirements = (quest: Quest): boolean => {
    for (const requirement of quest.requirements) {
      if (!requirement.status?.completable) {
        return false;
      }
    }

    return true;
  };

  // TODO: convert to TextBool
  const meetsObjectives = (quest: Quest): boolean => {
    for (const objective of quest.objectives) {
      if (!objective.status?.completable) {
        return false;
      }
    }

    return true;
  };

  const canAccept = (quest: Quest): boolean => {
    if (quest.repeatable) return meetsRepeat(quest) && meetsRequirements(quest);
    if (!meetsMax(props.account, quest)) return false;
    return meetsRequirements(quest);
  };

  const canComplete = (quest: Quest): boolean => {
    return meetsObjectives(quest);
  };

  /////////////////
  // INTERPRETATION

  const getNumCompleted = (account: Account, questIndex: number): number => {
    let ongoing = 0;
    account.quests?.completed.forEach((q: Quest) => {
      if (q.index === questIndex) ongoing++;
    });
    return ongoing;
  };

  const getItemName = (itemIndex: number): string => {
    let entityIndex = props.utils.queryItemRegistry(Number(itemIndex));
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name ? registryObject.name : `Item ${itemIndex}`;
  };

  const getFoodName = (itemIndex: number): string => {
    let entityIndex = props.utils.queryItemRegistry(itemIndex);
    let registryObject = props.utils.getItem(entityIndex);
    return registryObject.name ? registryObject.name : `Food ${itemIndex}`;
  };

  const getRepeatText = (quest: Quest): string => {
    const allQuests = props.account.quests?.ongoing.concat(props.account.quests?.completed);
    const curr = allQuests?.find((x) => x.index == quest.index);

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
  };

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
        text = `Complete Quest [${
          props.utils.getQuestByIndex(requirement.target.value!)
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
        text =
          text + ` [${Number(requirement.status?.current)}/${Number(requirement.status?.target)}]`;
      }
    }

    return text;
  };

  const getRewardText = (reward: Reward): string => {
    const value = (reward.target.value ?? 0) * 1;
    switch (reward.target.type) {
      case 'COIN':
        return `${value} $MUSU`;
      case 'ITEM':
        return `${value} ${getItemName(reward.target.index!)}`;
      case 'EXPERIENCE':
        return `${value} Experience`;
      case 'MINT20':
        return `${value} $KAMI`;
      case 'QUEST_POINTS':
        return `${value} Quest Point${value == 1 ? '' : 's'}`;
      default:
        return '???';
    }
  };

  // idea: room objectives should state the number of rooms away you are on the grid map
  const getObjectiveText = (objective: Objective, showTracking: boolean): string => {
    let text = objective.name;

    if (showTracking) {
      let tracking = '';
      if (objective.status?.completable) {
        tracking = ' ✅';
      } else {
        tracking = ` [${objective.status?.current ?? 0}/${Number(objective.status?.target)}]`;
      }
      text += tracking;
    }

    return text;
  };

  ///////////////////
  // DISPLAY

  const getAvailableQuests = () => {
    // get available, non-repeatable quests from registry
    const oneTimes = props.registryQuests.filter((q: Quest) => {
      return meetsRequirements(q) && meetsMax(props.account, q) && !q.repeatable;
    });

    // get available, repeatable quests from registry
    const repeats = props.registryQuests.filter((q: Quest) => {
      return meetsRequirements(q) && q.repeatable && meetsRepeat(q);
    });

    const quests = repeats.concat(oneTimes);
    return quests;
  };

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
        </Tooltip>
      </div>
    );
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
        </Tooltip>
      </div>
    );
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
    );
  };

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
    );
  };

  const RewardDisplay = (rewards: Reward[]) => {
    if (rewards.length == 0) return <div />;

    // sort rewards so Quest Points are always first
    const first = 'QUEST_POINTS';
    rewards.sort((x, y) => {
      return x.target.type == first ? -1 : y.target.type == first ? 1 : 0;
    });
    return (
      <ConditionContainer key='rewards'>
        <ConditionName>Rewards</ConditionName>
        {rewards.map((reward) => (
          <ConditionDescription key={reward.id}>
            - {`${getRewardText(reward)}`}
          </ConditionDescription>
        ))}
      </ConditionContainer>
    );
  };

  const AvailableQuests = () => {
    const quests = getAvailableQuests();

    if (quests.length == 0) return <EmptyText>No available quests. Do something else.</EmptyText>;

    return quests.map((q: Quest) => (
      <QuestContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {RequirementDisplay(q.requirements)}
        {ObjectiveDisplay(q.objectives, false)}
        {RewardDisplay(q.rewards)}
        {AcceptButton(q)}
      </QuestContainer>
    ));
  };

  const CompletedQuests = () => {
    let quests = [...(props.account.quests?.completed ?? [])];

    const line =
      quests.length > 0 ? (
        <CollapseText onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '- Completed (collapsed) -' : '- Completed -'}
        </CollapseText>
      ) : (
        <div />
      );

    const dones = quests.map((q: Quest) => (
      <DoneContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {ObjectiveDisplay(q.objectives, false)}
        {RewardDisplay(q.rewards)}
      </DoneContainer>
    ));

    return (
      <div>
        {line}
        {isCollapsed ? <div /> : dones}
      </div>
    );
  };

  const OngoingQuests = () => {
    getAvailableQuests(); // update numAvail
    const rawQuests = [...(props.account.quests?.ongoing ?? [])];

    if (rawQuests.length == 0) return <EmptyText>No ongoing quests. Get a job?</EmptyText>;

    rawQuests.reverse();

    const completable: Quest[] = [];
    const uncompletable: Quest[] = [];
    rawQuests.forEach((q: Quest) => {
      if (canComplete(q)) completable.push(q);
      else uncompletable.push(q);
    });
    const quests = completable.concat(uncompletable);

    return (
      <div>
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
      </div>
    );
  };

  const QuestsDisplay = () => {
    if (props.mode == 'AVAILABLE') return AvailableQuests();
    else if (props.mode == 'ONGOING') return OngoingQuests();
    else return <div />;
  };

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

const CollapseText = styled.button`
  border: none;
  background-color: transparent;

  width: 100%;
  textalign: center;
  padding: 0.5vw;

  color: #bbb;
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: center;

  &:hover {
    color: #666;
    cursor: pointer;
  }
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
  color: #bbb;
`;
