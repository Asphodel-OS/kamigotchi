import styled from 'styled-components';

import { ActionListButton, TextTooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
import { Allo } from 'network/shapes/Allo';
import { Objective } from 'network/shapes/Quest/objective';
import { DetailedEntity } from 'network/shapes/utils';

type QuestStatus = 'AVAILABLE' | 'ONGOING' | 'COMPLETED';

const DEFAULT_BUTTONS = {
  AcceptButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
  CompleteButton: { label: '', onClick: () => {}, disabled: false, backgroundColor: '#f8f6e4' },
};

export const Bottom = ({
  color = '',
  buttons = DEFAULT_BUTTONS,
  rewards = [],
  objectives = [],
  describeEntity,
  burnItems,
  getItemBalance,
  questStatus,
}: {
  color: string;
  buttons?: {
    AcceptButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
    CompleteButton: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      backgroundColor?: string;
    };
  };
  rewards?: Allo[];
  objectives?: Objective[];
  describeEntity?: (type: string, index: number) => DetailedEntity;
  burnItems: (indices: number[], amts: number[]) => void;
  getItemBalance: (index: number) => number;
  questStatus?: QuestStatus;
}) => {
  const { CompleteButton, AcceptButton } = buttons;

  const getRewardDisplay = (reward: Allo, index: number) => {
    if (reward.type === 'NFT') return null;
    const entity = describeEntity?.(reward.type, reward.index || 0);
    if (!entity) return null;

    return (
      <TextTooltip key={`reward-${index}`} text={[entity.name]} direction='row'>
        <RewardItem>
          <RewardImage src={entity.image} />
          <span style={{ color: color }}>x{(reward.value ?? 0) * 1}</span>
        </RewardItem>
      </TextTooltip>
    );
  };

  const ItemBurnButton = (objective: Objective) => {
    const show = questStatus === 'ONGOING' && objective.target.type === 'ITEM_BURN';
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

  const getObjectiveDisplay = (obj: Objective, index: number) => {
    const isComplete = obj.status?.completable;
    const hasProgress = obj.status?.target && obj.status?.current !== undefined;
    const burnButton = ItemBurnButton(obj);

    return (
      <ObjectiveRow key={`obj-${index}`}>
        {burnButton}
        <ObjectiveItem complete={isComplete} color={color}>
          {isComplete ? '✓' : '•'} {obj.name}
          {hasProgress && !isComplete && !burnButton && (
            <span style={{ color: color }}>
              [{Number(obj.status?.current)}/{Number(obj.status?.target)}]
            </span>
          )}
        </ObjectiveItem>
      </ObjectiveRow>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container color={color}>
      <DetailsSection>
        {objectives.length > 0 && (
          <Section>
            <SectionTitle color={color}>Objectives:</SectionTitle>
            <ItemsRow>{objectives.map((obj, i) => getObjectiveDisplay(obj, i))}</ItemsRow>
          </Section>
        )}
        {rewards.length > 0 && (
          <Section>
            <SectionTitle color={color}>Rewards:</SectionTitle>
            <ItemsRow>{rewards.map((reward, i) => getRewardDisplay(reward, i))}</ItemsRow>
          </Section>
        )}
      </DetailsSection>
      <Options>
        <Label color={color}>Options:</Label>

        <Option
          color={color}
          onClick={AcceptButton.onClick}
          disabled={AcceptButton.disabled}
          backgroundColor={AcceptButton.backgroundColor}
        >
          <TextTooltip
            text={
              AcceptButton.label === 'Journey Onwards'
                ? ['Proceed to the next quest in this chain']
                : []
            }
            direction='row'
            cursor={'pointer'}
          >
            {AcceptButton.label}
          </TextTooltip>
        </Option>

        <Option
          color={color}
          onClick={CompleteButton.onClick}
          disabled={CompleteButton.disabled}
          backgroundColor={CompleteButton.backgroundColor}
        >
          {CompleteButton.label}
        </Option>
      </Options>
    </Container>
  );
};

const Container = styled.div<{ color: string }>`
  position: relative;
  display: flex;
  flex-flow: row nowrap;
  border-top: solid grey 0.15em;
  height: 25vh;
  transition: height 0.3s ease;
  overflow-y: auto;
  ::-webkit-scrollbar {
    background: transparent;
    width: 0.3em;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ color }) => color};
    border-radius: 0.3em;
  }
`;

const DetailsSection = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 60%;
  padding: 0.5em 1em 0 1em;
  gap: 0.8em;
  line-height: 1.2em;
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.4em;
`;

const SectionTitle = styled.div<{ color?: string }>`
  font-size: 0.8em;
  font-weight: bold;
  color: ${({ color }) => color};
`;

const ItemsRow = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 0.5em;
`;

const RewardItem = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3em;
  padding: 0.3em;
  border: solid #5e4a14ff 0.1em;
  border-radius: 0.3em;
  font-size: 0.7em;
  background-color: rgba(248, 246, 228, 0.8);
`;

const RewardImage = styled.img`
  height: 1.5em;
  width: 1.5em;
  image-rendering: pixelated;
`;

const ObjectiveRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3em;
`;

const ObjectiveItem = styled.div<{ complete?: boolean; color?: string }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3em;
  padding: 0.3em;
  border: solid #5e4a14ff 0.1em;
  border-radius: 0.3em;
  font-size: 0.83em;
  background-color: rgba(248, 246, 228, 0.8);
  color: ${({ color }) => color};
  ${({ complete }) => complete && 'opacity: 0.6;'}
`;

const Options = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  width: 45%;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 0.9em;
  padding-top: 1em;
  padding-right: 1em;
`;

const Label = styled.div<{ color?: string }>`
  font-size: 1em;
  margin-right: 41%;
  color: ${({ color }) => color};
`;

const Option = styled.button<{ color?: string; backgroundColor?: string }>`
  position: relative;
  ${({ color }) => color && `color: ${color};  border: solid ${color} 0.15em;`}
  padding: 0.2em 0.3em 0em 0.3em;
  font-size: 0.8em;
  z-index: 3;
  box-shadow: 0 0.1em 0.2em rgba(0, 0, 0, 1);
  cursor: pointer;
  width: 47%;
  border-radius: 0.3em;
  line-height: 1.3em;

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    z-index: 1;
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }
`;
