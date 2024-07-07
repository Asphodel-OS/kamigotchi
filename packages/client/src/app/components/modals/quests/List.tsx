import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { MUSU_INDEX } from 'constants/indices';
import moment from 'moment';
import { Account } from 'network/shapes/Account';
import { Objective, Quest, Requirement, Reward } from 'network/shapes/Quest';
import { Room } from 'network/shapes/Room';
import { Condition } from 'network/shapes/utils/Conditionals';
import { DetailedEntity } from 'network/shapes/utils/EntityTypes';

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
    getRoom: (roomIndex: number) => Room;
    getQuestByIndex: (index: number) => Quest | undefined;
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
}

export const List = (props: Props) => {
  const { account, registryQuests, mode, actions, utils } = props;
  const { getQuestByIndex, getRoom, getDescribedEntity } = utils;

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
    utils.setNumAvail(getAvailableQuests().length);
  }, [registryQuests.length, account.quests?.ongoing.length]);

  ///////////////////
  // LOGIC

  const isOngoing = (account: Account, questIndex: number): boolean => {
    return account.quests?.ongoing.some((q: Quest) => q.index === questIndex) ?? false;
  };

  const meetsMax = (account: Account, quest: Quest): boolean => {
    return (isOngoing(account, quest.index) ? 1 : 0) + getNumCompleted(account, quest.index) < 1;
  };

  const meetsRepeat = (quest: Quest): boolean => {
    const allQuests = account.quests?.ongoing.concat(account.quests?.completed);
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
    if (!meetsMax(account, quest)) return false;
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

  const getRepeatText = (quest: Quest): string => {
    const allQuests = account.quests?.ongoing.concat(account.quests?.completed);
    const curr = allQuests?.find((x) => x.index == quest.index);

    // has not accepted repeatable before
    if (curr === undefined) return '';

    // must be repeatable (should not get here)
    if (!quest.repeatable) return 'not repeatable';

    // must be completed
    if (curr === undefined || !curr.complete) return 'already ongoing';

    const now = lastRefresh / 1000;
    const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
    if (Number(curr.startTime) + Number(wait) > Number(now))
      return `repeats in ${moment.duration((curr.startTime + wait - now) * 1000).humanize()}`;
    else return '';
  };

  const getRequirementText = (requirement: Requirement): string => {
    return parseConditionalText(requirement);
  };

  const getRewardText = (reward: Reward): string => {
    // not all types use getDescribedEntity
    const name = getDescribedEntity(reward.target.type, reward.target.index || 0).name;
    const value = (reward.target.value ?? 0) * 1;

    if (reward.target.type === 'ITEM') {
      return `${value} ${name}`;
    } else if (reward.target.type === 'EXPERIENCE') {
      return `${value} Experience`;
    } else if (reward.target.type === 'MINT20') {
      return `${value} ${name}`;
    } else if (reward.target.type === 'REPUTATION') {
      return `${value} REPUTATION`;
    } else if (reward.target.type === 'NFT') {
      return `Kamigotchi World Passport`;
    } else {
      return '???';
    }
  };

  const getRewardImage = (reward: Reward) => {
    if (reward.target.type === 'REPUTATION') return <div />;
    return (
      <ConditionImage
        src={getDescribedEntity(reward.target.type, reward.target.index || 0).image}
      />
    );
  };

  // idea: room objectives should state the number of rooms away you are on the grid map
  const getObjectiveText = (objective: Objective, showTracking: boolean): string => {
    return objective.name + (showTracking ? parseConditionalTracking(objective) : '');
  };

  const parseConditionalUnits = (con: Condition): [string, string] => {
    let tar = ((con.target.value ?? 0) * 1).toString();
    let curr = ((con.status?.current ?? 0) * 1).toString();

    if (con.target.type.includes('TIME')) {
      tar = moment.duration((con.target.value ?? 0) * 1000).humanize();
      curr = moment.duration((con.status?.current ?? 0) * 1000).humanize();
    } else if (con.target.type.includes('ITEM') && con.target.index === MUSU_INDEX) {
      tar = tar + ' MUSU';
      curr = curr + ' MUSU';
    }

    return [tar, curr];
  };

  const parseConditionalTracking = (con: any): string => {
    const [tar, curr] = parseConditionalUnits(con);

    if (con.status?.completable) return ` ✅`;
    const hideProgress = con.target.type == 'QUEST' || con.target.type == 'ROOM';
    return hideProgress ? '' : ` [${curr}/${tar}]`;
  };

  // converts machine condition text to something more human readable
  const parseConditionalText = (con: Condition): string => {
    const [targetVal, currVal] = parseConditionalUnits(con);

    let text = '';
    if (con.target.type == 'ITEM')
      text = `${targetVal} ${getDescribedEntity(con.target.type, con.target.index!).name}`;
    else if (con.target.type == 'HARVEST_TIME') text = `Harvest for more than ${targetVal}`;
    else if (con.target.type == 'LIQUIDATE_TOTAL') text = `Liquidate at least ${targetVal} Kami`;
    else if (con.target.type == 'LIQUIDATED_VICTIM') text = `Been liquidated ${targetVal} times`;
    else if (con.target.type == 'KAMI_LEVEL_HIGHEST') text = `Have a Kami of at least ${targetVal}`;
    else if (con.target.type == 'KAMI') text = `Have at least ${targetVal} Kami`;
    else if (con.target.type == 'QUEST')
      text = `Complete Quest [${getQuestByIndex(con.target.index!)?.name || `Quest ${targetVal}`}]`;
    else if (con.target.type == 'QUEST_REPEATABLE_COMPLETE')
      text = `Complete ${targetVal} daily quests`;
    else if (con.target.type == 'ROOM')
      text = `Move to ${getRoom(con.target.index!)?.name || `Room ${targetVal}`}`;
    else if (con.target.type == 'COMPLETE_COMP')
      text = 'Gate at Scrap Paths unlocked'; // hardcoded - only goals use this. change in future
    else if (con.target.type == 'REPUTATION') text = `Have ${targetVal} Reputation Points`;
    else text = '???';

    return text + parseConditionalTracking(con);
  };

  ///////////////////
  // DISPLAY

  const getAvailableQuests = () => {
    // get available, non-repeatable quests from registry
    const oneTimes = registryQuests.filter((q: Quest) => {
      return meetsRequirements(q) && meetsMax(account, q) && !q.repeatable;
    });

    // get available, repeatable quests from registry
    const repeats = registryQuests.filter((q: Quest) => {
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
            onClick={() => actions.acceptQuest(quest)}
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
            onClick={() => actions.completeQuest(quest)}
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
            - {`${getRequirementText(requirement)}`}
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

    // sort rewards so reputation are always first
    const first = 'REPUTATION';
    rewards.sort((x, y) => {
      return x.target.type == first ? -1 : y.target.type == first ? 1 : 0;
    });
    return (
      <ConditionContainer key='rewards'>
        <ConditionName>Rewards</ConditionName>
        {rewards.map((reward) => (
          <Row key={reward.id}>
            <ConditionDescription key={reward.id}>
              - {`${getRewardText(reward)}`}
            </ConditionDescription>
            {getRewardImage(reward)}
          </Row>
        ))}
      </ConditionContainer>
    );
  };

  const AvailableQuests = () => {
    const quests = getAvailableQuests();

    if (quests.length == 0)
      return (
        <EmptyText>
          No available quests.
          <br /> Do something else?
        </EmptyText>
      );

    return quests.map((q: Quest) => (
      <QuestContainer key={q.id}>
        <QuestName>{q.name}</QuestName>
        <QuestDescription>{q.description}</QuestDescription>
        {/* {RequirementDisplay(q.requirements)} */}
        {ObjectiveDisplay(q.objectives, false)}
        {RewardDisplay(q.rewards)}
        {AcceptButton(q)}
      </QuestContainer>
    ));
  };

  const CompletedQuests = () => {
    let quests = [...(account.quests?.completed ?? [])];

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
    const rawQuests = [...(account.quests?.ongoing ?? [])];

    if (rawQuests.length == 0)
      return (
        <EmptyText>
          No ongoing quests.
          <br /> Get a job?
        </EmptyText>
      );

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
    if (mode == 'AVAILABLE') return AvailableQuests();
    else if (mode == 'ONGOING') return OngoingQuests();
    else return <div />;
  };

  return <Container>{QuestsDisplay()}</Container>;
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
`;

const EmptyText = styled.div`
  height: 100%;
  margin: 1.5vh;
  padding: 1.2vh 0vw;

  color: #333;
  font-family: Pixel;
  font-size: 1.8vh;
  line-height: 4.5vh;
  text-align: center;
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

const ConditionImage = styled.img`
  height: 1.5vw;
`;

const DoneContainer = styled(QuestContainer)`
  border-color: #999;
  border-width: 1.5px;
  color: #bbb;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
