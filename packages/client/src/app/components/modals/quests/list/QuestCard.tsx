import styled from 'styled-components';

import { ActionListButton, IconButton, Overlay, TextTooltip } from 'app/components/library';
import { triggerQuestDialogueModal } from 'app/triggers/triggerQuestDialogueModal';
import { QuestsIcon } from 'assets/images/icons/menu';
import { Allo } from 'network/shapes/Allo';
import { parseConditionalTracking } from 'network/shapes/Conditional';
import { meetsObjectives, Objective, Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { getFactionImage } from 'network/shapes/utils/images';

// Quest Card
export const QuestCard = ({
  quest,
  status,
  actions,
  utils,
  imageCache,
}: {
  quest: Quest;
  status: QuestStatus;
  actions: QuestModalActions;
  utils: {
    describeEntity: (type: string, index: number) => DetailedEntity;
    getItemBalance: (index: number) => number;
  };
  imageCache: Map<string, JSX.Element>;
}) => {
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

  // get the Faction image of a Quest based on whether it has a REPUTATION reward
  // NOTE: hardcoded to agency for now
  const getFactionStamp = (quest: Quest) => {
    const reward = quest.rewards.find((r) => r.type === 'REPUTATION');
    if (!reward) return null;
    const index = reward.index;

    let iconKey = '';
    if (index === 1) iconKey = 'agency';
    else if (index === 2) iconKey = 'mina';
    else if (index === 3) iconKey = 'kami';

    const key = `faction-${index}`;
    if (!imageCache.has(key)) {
      const icon = getFactionImage(iconKey ?? 'agency');
      const component = <Image src={icon} size={1.8} />;
      imageCache.set(key, component);
    }

    return imageCache.get(key);
  };

  // get the Reward image component of a Quest
  const getRewardImage = (reward: Allo) => {
    if (reward.type === 'NFT') return <div />;

    const key = `reward-${reward.type}-${reward.index}`;
    if (!imageCache.has(key)) {
      const entity = describeEntity(reward.type, reward.index || 0);
      const component = (
        <TextTooltip key={key} text={[entity.name]} direction='row'>
          <Image src={entity.image} size={1.5} />
        </TextTooltip>
      );
      imageCache.set(key, component);
    }

    return imageCache.get(key);
  };

  /////////////////
  // DISPLAY

  const ItemBurnButton = (objective: Objective) => {
    const show = status === 'ONGOING' && objective.target.type === 'ITEM_BURN';
    if (!show) return <></>;

    const index = objective.target.index ?? 0;
    const have = getItemBalance(index);
    const gave = (objective.status?.current ?? 0) * 1;
    const want = (objective.status?.target ?? 0) * 1;
    const diff = want - gave;

    if (diff <= 0) return <></>;

    const options = [];
    if (have > 0) {
      options.push({
        text: 'Give 1',
        onClick: () => burnItems([index], [1]),
      });
    }
    if (diff > have && have > 1) {
      options.push({
        text: `Give ${have}`,
        onClick: () => burnItems([index], [have]),
      });
    }
    if (have >= diff && diff > 1) {
      options.push({
        text: `Give ${diff}`,
        onClick: () => burnItems([index], [diff]),
      });
    }

    return (
      <ActionListButton
        id={`quest-item-burn-${objective.id}`}
        text={`[${gave}/${want}]`}
        options={options}
        size='medium'
        disabled={have == 0}
      />
    );
  };

  /////////////////
  // RENDER
  const factionStamp = getFactionStamp(quest);
  return (
    <Container key={quest.id} completed={status === 'COMPLETED'}>
      <Title>
        {quest.name}
        {factionStamp && <Faction>{factionStamp}</Faction>}
      </Title>
      <Section key='objectives' style={{ display: quest.objectives.length > 0 ? 'block' : 'none' }}>
        <SubTitle>Objectives</SubTitle>
        {quest.objectives.map((o) => (
          <Row key={o.id}>
            {ItemBurnButton(o)}
            <ConditionText objective={true}>{getObjectiveText(o)}</ConditionText>
          </Row>
        ))}
      </Section>
      <Section key='rewards' style={{ display: quest.rewards.length > 0 ? 'block' : 'none' }}>
        <SubTitle>Rewards</SubTitle>
        <Row>
          {quest.rewards.map((r, i) => (
            <ConditionText key={`${r.type}-${r.index}-${i}`} objective={false}>
              {getRewardImage(r)}
              {`x${(r.value ?? 0) * 1}`}
            </ConditionText>
          ))}
        </Row>
      </Section>
      {quest.typeComp === 'MAIN' && (
        <Overlay top={4.5} right={2}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {quest.typeComp.toLowerCase()}
          </div>
        </Overlay>
      )}
      <ButtonRow>
        {meetsObjectives(quest) && status !== 'AVAILABLE' && !quest.complete && (
          <TickIcon>✓</TickIcon>
        )}
        <IconButton
          scale={2.5}
          img={status !== 'AVAILABLE' ? QuestsIcon : null}
          text={status === 'AVAILABLE' ? ' Details' : ''}
          onClick={() => {
            triggerQuestDialogueModal(quest.entity);
          }}
        />
      </ButtonRow>
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

  ${({ completed }) => completed && 'opacity: 0.5;'}
`;

const Title = styled.div`
  display: flex;
  font-size: 0.9vw;
  line-height: 1.2vw;
  width: 100%;
  font-weight: bold;
  background-color: rgba(248, 246, 228, 1);
  border-radius: 0.5vw;
  padding: 0.3vw;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  flex-wrap: nowrap;
`;

const Faction = styled.div`
  border: 0.15vw solid #e4c270;
  border-radius: 6.5vw;
  height: 2vw;
  width: 2vw;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: 0.3vw;
`;

const SubTitle = styled.div`
  font-size: 0.8vw;
  line-height: 1.5vw;
  text-align: left;
  justify-content: flex-start;
  background-color: #f5f0cdff;
  border-radius: 0.5vw;
  padding: 0.3vw;
  width: fit-content;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row wrap;

  justify-content: left;
  align-items: flex-start;
  margin: 0.3vw;
  gap: 0.3vw;
`;

const ConditionText = styled.div<{ objective: boolean }>`
  font-size: 0.7vw;
  padding: ${({ objective }) => (objective ? '0.6vw' : '0.2vw')};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border: solid black 0.15vw;
  border-radius: 0.3vw;
`;

const Image = styled.img<{ size: number }>`
  height: ${({ size }) => size}vw;
  width: ${({ size }) => size}vw;
  margin-right: ${({ size }) => size * 0.2}vw;
  user-drag: none;
`;

const ButtonRow = styled.div`
  position: absolute;
  right: 3%;
  bottom: 5%;
  display: flex;
  z-index: 0;
`;

const TickIcon = styled.div`
  position: absolute;
  bottom: -30%;
  left: 40%;
  font-size: 2.5vw;
  font-weight: bold;
  color: rgba(59, 185, 0, 1);
  z-index: 2;
  pointer-events: none;
`;
