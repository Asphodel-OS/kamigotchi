import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { parseConditionalTracking } from 'network/shapes/Conditional';
import { meetsObjectives, Objective, Quest } from 'network/shapes/Quest';
import { getRewardText } from 'network/shapes/Quest/reward';
import { Reward } from 'network/shapes/Rewards';
import { DetailedEntity } from 'network/shapes/utils';

interface Props {
  quest: Quest;
  status: QuestStatus;
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
  const { quest, status, actions, utils } = props;
  const { accept, complete } = actions;
  const { getDescribedEntity } = utils;

  const getRewardImage = (reward: Reward) => {
    if (reward.target.type === 'REPUTATION' || reward.target.type === 'NFT') return <div />;
    return <Image src={getDescribedEntity(reward.target.type, reward.target.index || 0).image} />;
  };

  // idea: room objectives should state the number of rooms away you are on the grid map
  const getObjectiveText = (objective: Objective): string => {
    let prefix = '•';
    if (status !== 'AVAILABLE') prefix = parseConditionalTracking(objective);
    return `${prefix} ${objective.name}`;
  };

  const AcceptButton = (quest: Quest) => {
    return (
      <Overlay bottom={0.8} right={0.8}>
        <ActionButton onClick={() => accept(quest)} text='Accept' />
      </Overlay>
    );
  };

  const CompleteButton = (quest: Quest) => {
    let tooltipText = '';
    if (!meetsObjectives(quest)) {
      tooltipText = 'Unmet objectives';
    }

    return (
      <Overlay bottom={0.8} right={0.8}>
        <Tooltip text={[tooltipText]}>
          <ActionButton
            onClick={() => complete(quest)}
            text='Complete'
            disabled={!meetsObjectives(quest)}
          />
        </Tooltip>
      </Overlay>
    );
  };

  const ObjectiveDisplay = (objectives: Objective[]) => {
    return (
      <Section key='objectives'>
        <SubTitle>Objectives</SubTitle>
        {objectives.map((objective) => (
          <ConditionText key={objective.id}>{`${getObjectiveText(objective)}`}</ConditionText>
        ))}
      </Section>
    );
  };

  const RewardDisplay = (rewards: Reward[]) => {
    return (
      <Section key='rewards'>
        <SubTitle>Rewards</SubTitle>
        {rewards.map((reward) => (
          <Row key={reward.id}>
            <ConditionText key={reward.id}>
              {getRewardImage(reward)}
              {`${getRewardText(reward)}`}
            </ConditionText>
          </Row>
        ))}
      </Section>
    );
  };

  return (
    <Container key={quest.id} completed={status === 'COMPLETED'}>
      <Title>{quest.name}</Title>
      <Description>{quest.description}</Description>
      {ObjectiveDisplay(quest.objectives)}
      {RewardDisplay(quest.rewards)}
      {status === 'AVAILABLE' && AcceptButton(quest)}
      {status === 'ONGOING' && CompleteButton(quest)}
    </Container>
  );
};

const Container = styled.div<{ completed?: boolean }>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 1.2vw;
  padding: 1.2vw;
  margin: 0.9vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;

  ${({ completed }) => completed && 'opacity: 0.3;'}
`;

const Title = styled.div`
  font-size: 1.2vw;
  line-height: 1.8vw;
  padding: 0.7vh 0vw;
`;

const Description = styled.div`
  line-height: 1.4vw;
  font-size: 0.75vw;
  padding: 0.45vw;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: 0.6vw 0.45vw;
`;

const SubTitle = styled.div`
  font-size: 0.9vw;
  line-height: 1.2vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0vw 0vw 0.3vw 0vw;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ConditionText = styled.div`
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;

const Image = styled.img`
  height: 1.5vw;
`;
