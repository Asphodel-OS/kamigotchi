import styled from 'styled-components';

import { ActionListButton, IconButton, TextTooltip } from 'app/components/library';
import { useSelected } from 'app/stores';
import { triggerQuestDetailsModal } from 'app/triggers/triggerQuestDetailsModal';
import { mainQuestIcon } from 'assets/images/icons/misc';
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

  function getButtonText(status: string) {
    if (status === 'AVAILABLE') return 'Accept';
    if ((status === 'ONGOING' && !meetsObjectives(quest)) || status === 'COMPLETED') return 'Details';
    return 'Complete';
  }

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
    const index = reward.index ?? 0;

    let iconKey = '';
    if (index === 1) iconKey = 'agency';
    else if (index === 2) iconKey = 'mina';
    else if (index === 3) iconKey = 'kami';

    const key = `faction-${index}`;
    if (!imageCache.has(key)) {
      const icon = getFactionImage(iconKey ?? 'agency');
      const entity = describeEntity('FACTION', index);
      const component = (
        <TextTooltip key={key} text={[entity.name]} direction='row'>
          <IconImage src={icon} size={1.8} />
        </TextTooltip>
      );
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
  const isMainQuest = quest.typeComp === 'MAIN';

  return (
    <Container key={quest.id} isMainQuest={isMainQuest}>
      <Title>
        {quest.name}
        <IconsContainer>
          {isMainQuest && (
            <Faction>
              <TextTooltip text={['Main Questline']} direction='row'>
                <IconImage src={mainQuestIcon} size={1.8} />
              </TextTooltip>
            </Faction>
          )}
          {factionStamp && <Faction>{factionStamp}</Faction>}
        </IconsContainer>
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
      <ButtonRow>
        <IconButton
          text={getButtonText(status)}
          onClick={() => {
            triggerQuestDetailsModal(quest.entity);
            if (status === 'ONGOING' && meetsObjectives(quest)) {
              useSelected.setState({ questJustCompleted: quest.entity });
              complete(quest);
            }
          }}
        />
      </ButtonRow>
    </Container>
  );
};

const Container = styled.div<{ isMainQuest?: boolean }>`
  position: relative;
  border: solid black 0.15em;
  border-radius: 1.2em;
  padding: 1.2em;
  margin: 0.9em;
  background-color: ${({ isMainQuest }) => (isMainQuest ? '#E8F5E9' : '#fff')};

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
`;

const Title = styled.div`
  background-color: rgba(248, 246, 228, 1);
  border-radius: 0.5em;
  padding: 0.3em;
  width: 100%;

  font-size: 0.9em;
  line-height: 1.2em;
  font-weight: bold;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const IconsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3em;
`;

const Faction = styled.div`
  border: 0.15em solid #e4c270;
  border-radius: 6.5em;
  height: 2em;
  width: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin: 0.3em 0.3em;
`;

const SubTitle = styled.div`
  font-size: 0.8em;
  line-height: 1.5em;
  text-align: left;
  justify-content: flex-start;
  background-color: #f5f0cdff;
  border-radius: 0.5em;
  padding: 0.3em;
  width: fit-content;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row wrap;

  justify-content: left;
  align-items: flex-start;
  margin: 0.3em;
  gap: 0.3em;
`;

const ConditionText = styled.div<{ objective: boolean }>`
  border: solid black 0.15em;
  border-radius: 0.3em;
  padding: ${({ objective }) => (objective ? '0.6em' : '0.2em')};

  font-size: 0.7em;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border: solid black 0.15em;
  border-radius: 0.3em;
  background-color: #fff;
`;

const Image = styled.img<{ size: number }>`
  height: ${({ size }) => size}em;
  width: ${({ size }) => size}em;
  margin-right: ${({ size }) => size * 0.2}em;
  user-drag: none;
`;

const IconImage = styled.img<{ size: number }>`
  height: ${({ size }) => size}em;
  width: ${({ size }) => size}em;
  user-drag: none;
`;

const ButtonRow = styled.div`
  position: absolute;
  right: 3%;
  bottom: 5%;
  display: flex;
  z-index: 0;
`;
