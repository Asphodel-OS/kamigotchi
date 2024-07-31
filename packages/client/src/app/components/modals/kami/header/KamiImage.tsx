import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
import { Account } from 'network/shapes/Account';
import { isResting, Kami } from 'network/shapes/Kami';
import { getAffinityImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account;
  kami: Kami;
  actions: {
    levelUp: (kami: Kami) => void;
  };
}

export const KamiImage = (props: Props) => {
  const { account, kami, actions } = props;
  const { traits, experience } = kami;

  const handAffintiy = traits?.hand.affinity ?? 'NORMAL';
  const bodyAffintiy = traits?.body.affinity ?? 'NORMAL';
  const expLimit = experience.threshold;
  const expCurr = experience.current;
  const percentage = Math.round((expCurr / expLimit) * 1000) / 10;

  const isMine = (kami: Kami) => {
    return kami.account?.index === account.index;
  };

  const getLevelTooltip = () => {
    if (!isMine(kami)) return 'not ur kami';
    if (expCurr < expLimit) return 'not enough experience';
    if (!isResting(kami)) return 'kami must be resting';
    return 'Level Up!!';
  };

  const handleLevelUp = () => {
    actions.levelUp(kami);
    playClick();
  };

  return (
    <Container>
      <Image src={kami.image} />
      <Row top>
        <Grouping>
          <Text size={0.7}>Lvl</Text>
          <Text size={1}>{kami.level}</Text>
        </Grouping>
        <Grouping>
          <Tooltip text={[`${'Body'}: ${bodyAffintiy}`]}>
            <Icon key={'Body'} src={getAffinityImage(bodyAffintiy)} />
          </Tooltip>
          <Tooltip text={[`${'Hand'}: ${handAffintiy}`]}>
            <Icon key={'Hand'} src={getAffinityImage(handAffintiy)} />
          </Tooltip>
        </Grouping>
      </Row>
      <Row bottom>
        <Percentage>{`${Math.min(percentage, 100)}%`}</Percentage>
        <Tooltip text={[`${expCurr}/${expLimit}`]} grow>
          <ExperienceBar>
            <FilledBar percentage={percentage} />
          </ExperienceBar>
        </Tooltip>
        <Tooltip text={[getLevelTooltip()]}>
          <Button disabled={getLevelTooltip() !== 'Level Up!!'} onClick={() => handleLevelUp()}>
            <Text size={0.7}>↑</Text>
          </Button>
        </Tooltip>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: solid black 0.15vw;
`;

const Image = styled.img`
  border-radius: 0.45vw 0 0 0;
  height: 14vw;
`;

const Row = styled.div<{ bottom?: boolean; top?: boolean }>`
  position: absolute;
  width: 100%;

  ${(props) => props.bottom && 'bottom: 0'};
  ${(props) => props.top && 'top: 0'};

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Grouping = styled.div`
  display: flex;
  padding: 0.3vw;
  flex-flow: row nowrap;
  align-items: flex-end;
  height: 100%;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.4}vw white`};
`;

const Icon = styled.img`
  height: 2vw;
`;

const Percentage = styled.div`
  position: absolute;
  width: 100%;
  padding-top: 0.15vw;
  pointer-events: none;

  font-size: 0.6vw;
  text-align: center;
  text-shadow: 0 0 0.2vw white;
`;

const ExperienceBar = styled.div`
  position: relative;
  border-top: solid black 0.15vw;
  opacity: 0.5;
  background-color: #bbb;
  height: 1.5vw;
  width: 100%;

  display: flex;
  align-items: center;
`;

const FilledBar = styled.div<{ percentage: number }>`
  background-color: #11ee11;
  height: 100%;
  width: ${(props) => props.percentage}%;
`;

interface ButtonProps {
  color?: string;
  disabled?: boolean;
}

const Button = styled.div<ButtonProps>`
  border-top: solid black 0.15vw;
  border-left: solid black 0.15vw;
  opacity: 0.5;
  width: 1.5vw;
  height: 1.5vw;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#11ee11')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    opacity: 0.9;
    animation: ${() => hoverFx(1.1)} 0.2s;
    transform: scale(1.1);
  }
  &:active {
    animation: ${() => clickFx(1.1)} 0.3s;
  }
`;
