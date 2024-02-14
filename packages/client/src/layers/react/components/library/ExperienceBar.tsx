import styled from 'styled-components';
import { ActionButton } from './ActionButton';
import { Tooltip } from './Tooltip';

interface Props {
  level: number;
  current: number;
  total: number;
  disabled?: boolean; // external override to disable level up button
  disabledReason?: string; // reason for external override
  triggerLevelUp: Function;
}

export const ExperienceBar = (props: Props) => {
  const { level, current, total, triggerLevelUp, disabled, disabledReason } = props;
  const percentage = Math.round((current / total) * 1000) / 10;
  const canLevelUp = !disabled && current >= total;

  const getLevelUpTooltip = () => {
    if (disabledReason) return [disabledReason];
    if (!canLevelUp) return [`Not enough exprience points.`];
    return [`Level Up`];
  };

  return (
    <Wrapper>
      <Level>{`Lvl ${level}`}</Level>
      <Tooltip text={[`${current}/${total}`]}>
        <BarContainer>
          <FilledBar percentage={percentage} />
          <Percentage>{`${Math.min(percentage, 100)}%`}</Percentage>
        </BarContainer>
      </Tooltip>
      <Tooltip text={getLevelUpTooltip()}>
        <ActionButton
          id={`level-button`}
          onClick={() => triggerLevelUp()}
          text=' ↑ '
          size='small'
          disabled={!canLevelUp}
        />
      </Tooltip>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  font-family: Pixel;
  margin-left: 1vw;
`;

const BarContainer = styled.div`
  border: solid black 0.1vw;
  border-radius: 1vw;
  background-color: #bbb;
  height: 1.2vw;
  min-width: 12vw;
  margin: 0px 0.7vw;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: left;
`;

const FilledBar = styled.div<{ percentage: number }>`
  background-color: #11ee11;
  border-radius: 1vw;
  height: 100%;
  width: ${(props) => props.percentage}%;
`;

const Percentage = styled.div`
  width: 100%;
  color: black;
  position: absolute;
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: center;
`;

const Level = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 1vw;
`;
