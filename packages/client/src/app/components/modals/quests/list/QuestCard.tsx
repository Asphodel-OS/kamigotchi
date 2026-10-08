import styled from 'styled-components';

import { ActionListButton, TextTooltip } from 'app/components/library';
import { getObjectiveIcon, ObjectiveRow, Palette, RewardChip } from 'app/components/library/pastel';
import { useSelected } from 'app/stores';
import { triggerQuestDetailsModal } from 'app/triggers/triggerQuestDetailsModal';
import { mainQuestIcon } from 'assets/images/icons/misc';
import { ItemImages } from 'assets/images/items';
import { Allo } from 'network/shapes/Allo';
import { parseConditionalTracking } from 'network/shapes/Conditional';
import { meetsObjectives, Objective, Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { getFactionImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';

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
    findRoomByName: (name: string) => number | undefined;
  };
  imageCache: Map<string, JSX.Element>;
}) => {
  const { complete, burnItems } = actions;
  const { describeEntity, getItemBalance, findRoomByName } = utils;

  /////////////////
  // INTERPRETATION

  function getButtonText(status: string) {
    if (status === 'AVAILABLE') return 'Accept';
    if ((status === 'ONGOING' && !meetsObjectives(quest)) || status === 'COMPLETED')
      return 'Details';
    return 'Complete';
  }

  // progress count for an objective, e.g. "1/3"; burn objectives track gave/want
  const getCount = (objective: Objective): string | undefined => {
    if (status !== 'ONGOING') return;
    if (objective.target.type === 'ITEM_BURN') {
      const gave = (objective.status?.current ?? 0) * 1;
      const want = (objective.status?.target ?? 0) * 1;
      return want ? `${gave}/${want}` : undefined;
    }
    const tracking = parseConditionalTracking(objective).trim();
    return tracking.startsWith('[') ? tracking.slice(1, -1) : undefined;
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

  const getRewardChip = (reward: Allo, i: number) => {
    if (reward.type === 'NFT') return null;
    const key = `chip-${reward.type}-${reward.index}-${reward.value}`;
    if (!imageCache.has(key)) {
      const entity = describeEntity(reward.type, reward.index || 0);
      imageCache.set(
        key,
        <RewardChip key={key} entity={entity} amount={reward.value ?? 0} size='sm' />
      );
    }
    return <span key={`${key}-${i}`}>{imageCache.get(key)}</span>;
  };

  /////////////////
  // DISPLAY

  const ItemBurnButton = (objective: Objective) => {
    const show = status === 'ONGOING' && objective.target.type === 'ITEM_BURN';
    if (!show) return null;

    const index = objective.target.index ?? 0;
    const have = getItemBalance(index);
    const gave = (objective.status?.current ?? 0) * 1;
    const want = (objective.status?.target ?? 0) * 1;
    const diff = want - gave;
    if (diff <= 0) return null;

    const options = [];
    if (have > 0) options.push({ text: 'Give 1', onClick: () => burnItems([index], [1]) });
    if (diff > have && have > 1)
      options.push({ text: `Give ${have}`, onClick: () => burnItems([index], [have]) });
    if (have >= diff && diff > 1)
      options.push({ text: `Give ${diff}`, onClick: () => burnItems([index], [diff]) });

    return (
      <ActionListButton
        id={`quest-item-burn-${objective.id}`}
        text='Give'
        options={options}
        size='small'
        disabled={have == 0}
      />
    );
  };

  const handleButton = () => {
    playClick();
    triggerQuestDetailsModal(quest.entity);
    if (status === 'ONGOING' && meetsObjectives(quest)) {
      useSelected.setState({ questJustCompleted: quest.entity });
      complete(quest);
    }
  };

  /////////////////
  // RENDER

  const factionStamp = getFactionStamp(quest);
  const isMainQuest = quest.typeComp === 'MAIN';
  const tint = quest.repeatable ? CardTints.daily : isMainQuest ? CardTints.main : CardTints.side;
  const buttonText = getButtonText(status);
  const rewards = quest.rewards.filter((r) => r.type !== 'NFT');

  return (
    <Container key={quest.id} style={{ background: tint }}>
      <Head>
        <Title>{quest.name}</Title>
        <IconsContainer>
          {isMainQuest && (
            <Faction>
              <TextTooltip text={['Main Questline']} direction='row'>
                <IconImage src={mainQuestIcon} size={1.8} />
              </TextTooltip>
            </Faction>
          )}
          {quest.repeatable && (
            <Faction>
              <TextTooltip text={['Daily Quest']} direction='row'>
                <IconImage src={ItemImages.blue_pansy} size={1.5} />
              </TextTooltip>
            </Faction>
          )}
          {factionStamp && <Faction>{factionStamp}</Faction>}
        </IconsContainer>
      </Head>

      {quest.objectives.length > 0 && (
        <Section>
          <Label>Objectives</Label>
          {quest.objectives.map((o) => (
            <ObjectiveRow
              key={o.id}
              text={o.name}
              icon={getObjectiveIcon(o, describeEntity, findRoomByName)}
              complete={status === 'COMPLETED' || (status === 'ONGOING' && !!o.status?.completable)}
              count={getCount(o)}
              action={ItemBurnButton(o)}
            />
          ))}
        </Section>
      )}

      <Foot>
        {rewards.length > 0 ? (
          <Section>
            <Label>Rewards</Label>
            <Chips>{rewards.map(getRewardChip)}</Chips>
          </Section>
        ) : (
          <span />
        )}
        <Button primary={buttonText !== 'Details'} onClick={handleButton}>
          {buttonText}
        </Button>
      </Foot>
    </Container>
  );
};

// card tint by quest kind: daily blue, main green, side golden brown
const CardTints = { daily: '#eaf3fd', main: '#eef8ef', side: '#faf6ec' };

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75vw;
  margin-bottom: 0.8vw;
  padding: 0.9vw 1vw;

  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.9vw;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6vw;
`;

const Title = styled.span`
  min-width: 0;
  font-family: Pixel;
  font-size: 0.82vw;
  line-height: 1.35;
  color: ${Palette.ink};
`;

const IconsContainer = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const Faction = styled.div`
  border: 0.15vw solid #e4c270;
  border-radius: 6.5vw;
  height: 2vw;
  width: 2vw;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4vw;
  min-width: 0;
`;

const Label = styled.span`
  font-family: Pixel;
  font-size: 0.5vw;
  text-transform: uppercase;
  letter-spacing: 0.06vw;
  color: ${Palette.faint};
`;

const Foot = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.8vw;
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6vw;
  padding: 0 0.3vw 0.3vw 0;
`;

const Button = styled.button<{ primary: boolean }>`
  flex: none;
  height: 2vw;
  padding: 0 1vw;
  font-family: Pixel;
  font-size: 0.68vw;
  color: ${Palette.ink};
  background: ${({ primary }) => (primary ? Palette.button.bg : Palette.info.bg)};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.5vw;
  cursor: pointer;
  transition:
    background 0.1s ease,
    transform 0.05s ease;

  &:hover {
    background: ${({ primary }) => (primary ? Palette.button.hover : Palette.info.hover)};
  }
  &:active {
    transform: translateY(0.08vw);
  }
`;

const IconImage = styled.img<{ size: number }>`
  height: ${({ size }) => size}vw;
  width: ${({ size }) => size}vw;
  user-drag: none;
`;
