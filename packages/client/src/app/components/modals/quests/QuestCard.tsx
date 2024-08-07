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
  imageCache: Map<string, JSX.Element>;
}

// Quest Card
export const QuestCard = (props: Props) => {
  const { quest, status, actions, utils, imageCache } = props;
  const { accept, complete } = actions;
  const { getDescribedEntity } = utils;

  /////////////////
  // INTERPRETATION

  const getRewardImage = (reward: Reward) => {
    if (reward.target.type === 'REPUTATION' || reward.target.type === 'NFT') return <div />;
    const key = `reward-${reward.target.type}-${reward.target.index}`;
    if (imageCache.has(key)) return imageCache.get(key);

    const entity = getDescribedEntity(reward.target.type, reward.target.index || 0);
    const component = (
      <Tooltip key={key} text={[entity.name]} direction='row'>
        <Image src={entity.image} />
      </Tooltip>
    );
    imageCache.set(key, component);

    return component;
  };

  // idea: room objectives should state the number of rooms away you are on the grid map
  const getObjectiveText = (objective: Objective): string => {
    const prefix = status !== 'AVAILABLE' ? parseConditionalTracking(objective) : '•';
    return `${prefix} ${objective.name}`;
  };

  /////////////////
  // DISPLAY

  const AcceptButton = (quest: Quest) => {
    return (
      <Overlay bottom={0.8} right={0.8}>
        <ActionButton onClick={() => accept(quest)} text='Accept' noMargin />
      </Overlay>
    );
  };

  const CompleteButton = (quest: Quest) => {
    const tooltipText = meetsObjectives(quest) ? '' : 'Unmet objectives';
    return (
      <Overlay bottom={0.8} right={0.8}>
        <Tooltip text={[tooltipText]}>
          <ActionButton
            onClick={() => complete(quest)}
            text='Complete'
            disabled={!meetsObjectives(quest)}
            noMargin
          />
        </Tooltip>
      </Overlay>
    );
  };

  return (
    <Container key={quest.id} completed={status === 'COMPLETED'}>
      <Title>{quest.name}</Title>
      <Description>{quest.description}</Description>
      {quest.objectives.length > 0 && (
        <Section key='objectives'>
          <SubTitle>Objectives</SubTitle>
          {quest.objectives.map((objective) => (
            <ConditionText key={objective.id}>{`${getObjectiveText(objective)}`}</ConditionText>
          ))}
        </Section>
      )}
      {quest.rewards.length > 0 && (
        <Section key='rewards'>
          <SubTitle>Rewards</SubTitle>
          <Row>
            {quest.rewards.map((reward) => (
              <Row key={reward.id}>
                <ConditionText key={reward.id}>
                  {getRewardImage(reward)}
                  {`${getRewardText(reward)}`}
                </ConditionText>
              </Row>
            ))}
          </Row>
        </Section>
      )}
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
  padding: 0.45vw 0vw;
`;

const Description = styled.div`
  font-size: 0.75vw;
  line-height: 1.4vw;
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
  font-size: 0.75vw;
  padding: 0.3vw;
  padding-left: 0.6vw;
  gap: 0.15vw;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const Image = styled.img`
  height: 1.5vw;
`;
