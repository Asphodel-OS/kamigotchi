import moment from 'moment';
import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { parseConditionalTracking } from 'network/shapes/Conditional';
import {
  canAcceptQuest,
  meetsObjectives,
  meetsRepeat,
  meetsRequirements,
  Objective,
  Quest,
} from 'network/shapes/Quest';
import { getRewardText } from 'network/shapes/Quest/reward';
import { Reward } from 'network/shapes/Rewards';
import { DetailedEntity } from 'network/shapes/utils';

interface Props {
  account: Account;
  quest: Quest;
  actions: {
    accept: (quest: Quest) => void;
    complete: (quest: Quest) => void;
  };
  utils: {
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
}

// Quest Card
export const QuestCard = (props: Props) => {
  const { account, quest, actions, utils } = props;
  const { accept, complete } = actions;
  const { getDescribedEntity } = utils;

  const getRepeatText = (quest: Quest): string => {
    const allQuests = account.quests?.ongoing.concat(account.quests?.completed);
    const curr = allQuests?.find((x) => x.index == quest.index);

    if (curr === undefined) return ''; // never accepted
    if (!quest.repeatable) return 'not repeatable'; // not repeatable (mistake)
    if (!curr.complete) return 'already ongoing'; // already ongoing

    const now = Date.now() / 1000;
    const wait = curr.repeatDuration !== undefined ? curr.repeatDuration : 0;
    if (Number(curr.startTime) + Number(wait) > Number(now))
      return `repeats in ${moment.duration((curr.startTime + wait - now) * 1000).humanize()}`;
    else return '';
  };

  const getRewardImage = (reward: Reward) => {
    if (reward.target.type === 'REPUTATION' || reward.target.type === 'NFT') return <div />;
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

  const AcceptButton = (quest: Quest) => {
    let tooltipText = '';

    if (quest.repeatable) {
      const result = meetsRepeat(quest, account);
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
            onClick={() => accept(quest)}
            text='Accept'
            disabled={!canAcceptQuest(quest, account)}
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
            onClick={() => complete(quest)}
            text='Complete'
            disabled={!meetsObjectives(quest)}
          />
        </Tooltip>
      </div>
    );
  };

  // not in use
  // const RequirementDisplay = (requirements: Requirement[]) => {
  //   if (requirements.length == 0) return <div />;
  //   return (
  //     <ConditionContainer key='requirements'>
  //       <ConditionName>Requirements</ConditionName>
  //       {requirements.map((requirement) => (
  //         <ConditionDescription key={requirement.id}>
  //           - {`${parseCondText(requirement)}`}
  //         </ConditionDescription>
  //       ))}
  //     </ConditionContainer>
  //   );
  // };

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

  // available, ongoing, completed

  return (
    <Container key={quest.id}>
      <Name>{quest.name}</Name>
      <Description>{quest.description}</Description>
      {ObjectiveDisplay(quest.objectives, false)}
      {RewardDisplay(quest.rewards)}
      {AcceptButton(quest)}
      {CompleteButton(quest)}
    </Container>
  );
};

const Container = styled.div`
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

const Name = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0.7vh 0vw;
`;

const Description = styled.div`
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ConditionImage = styled.img`
  height: 1.5vw;
`;
