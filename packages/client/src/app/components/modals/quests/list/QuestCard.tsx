import styled from 'styled-components';

import { ActionButton, ActionListButton, Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { parseConditionalTracking } from 'network/shapes/Conditional';
import { meetsObjectives, Objective, Quest } from 'network/shapes/Quest';
import { Reward } from 'network/shapes/Rewards';
import { DetailedEntity } from 'network/shapes/utils';
import { getFactionImage } from 'network/shapes/utils/images';

interface Props {
  quest: Quest;
  status: QuestStatus;
  actions: QuestModalActions;
  utils: {
    describeEntity: (type: string, index: number) => DetailedEntity;
    getItemBalance: (index: number) => number;
  };
  imageCache: Map<string, JSX.Element>;
}

// Quest Card
export const QuestCard = (props: Props) => {
  const { quest, status, actions, utils, imageCache } = props;
  const { accept, complete, burnItems } = actions;
  const { describeEntity, getItemBalance } = utils;

  /////////////////
  // INTERPRETATION

  // idea: room objectives should state the number of rooms away you are on the grid map
  const getObjectiveText = (objective: Objective): string => {
    let prefix = '';
    if (status === 'AVAILABLE') prefix = '•';
    else if (status === 'ONGOING') prefix = parseConditionalTracking(objective);
    else if (status === 'COMPLETED') prefix = '✓';
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
    return (
      <Overlay bottom={0.8} right={0.8}>
        <ActionButton
          onClick={() => complete(quest)}
          text='Complete'
          disabled={!meetsObjectives(quest)}
          noMargin
        />
      </Overlay>
    );
  };

  const ItemBurnButton = (objective: Objective) => {
    const show = status === 'ONGOING' && objective.target.type === 'ITEM_BURN';
    if (!show) return <></>;

    const index = objective.target.index ?? 0;
    const need = (objective.status?.target ?? 0) - (objective.status?.current ?? 0);
    if (need <= 0) return <></>;

    const have = getItemBalance(index);
    const options = [];
    if (need > 0) {
      options.push({
        text: 'Give 1',
        onClick: () => burnItems([index], [1]),
        disabled: have < 1,
      });
    }
    if (need > 1) {
      options.push({
        text: `Give all (${need})`,
        onClick: () => burnItems([index], [need]),
        disabled: have < need,
      });
    }

    return (
      <ActionListButton
        id={`quest-item-burn-${objective.id}`}
        text=''
        options={options}
        size='small'
      />
    );
  };

  // get the Faction image of a Quest based on whether it has a REPUTATION reward
  // NOTE: hardcoded to agency for now
  const FactionImage = (quest: Quest) => {
    const reward = quest.rewards.find((r) => r.target.type === 'REPUTATION');
    if (!reward) return <></>;

    const key = `faction-${reward.target.type}-${reward.target.index}`;
    if (imageCache.has(key)) return imageCache.get(key);

    const icon = getFactionImage('agency');
    const component = <Image src={icon} size={1.8} />;

    imageCache.set(key, component);
    return component;
  };

  // get the Reward image component of a Quest
  const RewardImage = (reward: Reward) => {
    if (reward.target.type === 'NFT') return <div />;
    const key = `reward-${reward.target.type}-${reward.target.index}`;
    if (imageCache.has(key)) return imageCache.get(key);

    const entity = describeEntity(reward.target.type, reward.target.index || 0);
    const component = (
      <Tooltip key={key} text={[entity.name]} direction='row'>
        <Image src={entity.image} size={1.5} />
      </Tooltip>
    );

    imageCache.set(key, component);
    return component;
  };

  const ObjectiveRow = (objective: Objective) => {
    const text = getObjectiveText(objective);

    return (
      <Row>
        <ConditionText key={objective.id}>{text}</ConditionText>
        {ItemBurnButton(objective)}
      </Row>
    );
  };

  const Objectives = (quest: Quest) => {
    if (quest.objectives.length === 0) return null;
    return (
      <Section key='objectives'>
        <SubTitle>Objectives</SubTitle>
        {quest.objectives.map((o) => ObjectiveRow(o))}
      </Section>
    );
  };

  const Rewards = (quest: Quest) => {
    if (quest.rewards.length === 0) return null;
    return (
      <Section key='rewards'>
        <SubTitle>Rewards</SubTitle>
        <Row>
          {quest.rewards.map((r) => (
            <Row key={r.id}>
              <ConditionText key={r.id}>
                {RewardImage(r)}
                {`x${(r.target.value ?? 0) * 1}`}
              </ConditionText>
            </Row>
          ))}
        </Row>
      </Section>
    );
  };

  return (
    <Container key={quest.id} completed={status === 'COMPLETED'}>
      <Overlay top={0.6} right={0.6}>
        {FactionImage(quest)}
      </Overlay>
      <Title>{quest.name}</Title>
      <Description>{quest.description}</Description>
      {Objectives(quest)}
      {Rewards(quest)}
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
  background-color: #fff;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;

  ${({ completed }) => completed && 'opacity: 0.3;'}
`;

const Title = styled.div`
  font-size: 0.9vw;
  line-height: 1.2vw;
`;

const Description = styled.div`
  font-size: 0.6vw;
  line-height: 1.4vw;
  padding: 0.3vw 0.6vw;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: 0.3vw 0.3vw;
`;

const SubTitle = styled.div`
  font-size: 0.8vw;
  line-height: 1.5vw;
  text-align: left;
  justify-content: flex-start;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: flex-start;
`;

const ConditionText = styled.div`
  font-size: 0.7vw;
  padding: 0.3vw;
  padding-left: 0.3vw;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const Image = styled.img<{ size: number }>`
  height: ${({ size }) => size}vw;
  width: ${({ size }) => size}vw;
  margin-right: ${({ size }) => size * 0.2}vw;
`;
