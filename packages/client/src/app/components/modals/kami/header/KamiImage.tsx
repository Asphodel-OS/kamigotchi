import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { Tooltip } from 'app/components/library';
import { Overlay } from 'app/components/library/styles';
import { clickFx, hoverFx, Shimmer } from 'app/styles/effects';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

const LEVEL_UP_STRING = 'Level Up!!';

interface Props {
  actions: {
    levelUp: (kami: Kami) => void;
  };
  data: {
    account: Account;
    kami: Kami;
    owner: BaseAccount;
  };
  utils: {
    calcExpRequirement: (level: number) => number;
  };
}

export const KamiImage = (props: Props) => {
  const { actions, data, utils } = props;
  const { account, kami, owner } = data;
  const { calcExpRequirement } = utils;
  const { levelUp } = actions;

  const progress = kami.progress;
  const expCurr = progress ? progress.experience : 0;
  const expLimit = progress ? calcExpRequirement(progress.level) : 40;
  const percentage = Math.round((expCurr / expLimit) * 1000) / 10;

  const getLevelTooltip = () => {
    if (owner.index != account.index) return 'not ur kami';
    if (expCurr < expLimit) return 'not enough experience';
    if (!isResting(kami)) return 'kami must be resting';
    return LEVEL_UP_STRING;
  };

  const handleLevelUp = () => {
    levelUp(kami);
    playClick();
  };

  const canLevel = getLevelTooltip() === LEVEL_UP_STRING;
  return (
    <Container>
      <Image src={kami.image} />
      <Overlay top={0.9} left={0.7}>
        <Grouping>
          <Text size={0.6}>Lvl</Text>
          <Text size={0.9}>{progress ? progress.level : '??'}</Text>
        </Grouping>
      </Overlay>
      <Overlay top={0.9} right={0.7}>
        <Text size={0.9}>{kami.index}</Text>
      </Overlay>
      <Overlay bottom={0} fullWidth>
        <Tooltip text={[`${expCurr}/${expLimit}`]} grow>
          <ExperienceBar percent={percentage}></ExperienceBar>
        </Tooltip>
        <Percentage>{`${Math.min(percentage, 100)}%`}</Percentage>
        <Overlay bottom={0} right={0}>
          <Tooltip text={[getLevelTooltip()]}>
            <Button disabled={!canLevel} onClick={() => handleLevelUp()}>
              ↑{canLevel && <Shimmer />}
            </Button>
          </Tooltip>
        </Overlay>
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 18vw;
  margin: 0.6vw 0 0.6vw 0.6vw;
`;

const Image = styled.img`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  height: 100%;
  image-rendering: pixelated;
`;

const Grouping = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const Text = styled.div<{ size: number }>`
  color: white;
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.5}vw black`};
`;

const Percentage = styled.div`
  position: absolute;
  width: 100%;
  padding-top: 0.15vw;
  pointer-events: none;

  font-size: 0.75vw;
  text-align: center;
  text-shadow: 0 0 0.5vw white;
`;

const ExperienceBar = styled.div<{ percent: number }>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0 0 0.6vw 0.6vw;
  opacity: 0.6;
  background-color: #bbb;
  height: 1.8vw;
  width: 100%;

  background: ${({ percent }) =>
    `linear-gradient(90deg, #11ee11, 0%, #11ee11, ${percent * 0.95}%, #bbb, ${percent * 1.05}%, #bbb 100%)`};

  display: flex;
  align-items: center;
`;

interface ButtonProps {
  color?: string;
  disabled?: boolean;
}

const Button = styled.div<ButtonProps>`
  border: solid black 0.15vw;
  border-radius: 0 0 0.6vw 0;
  opacity: 0.8;
  height: 1.8vw;
  width: 1.8vw;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#11ee11')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    opacity: 0.9;
    animation: ${() => hoverFx(0.1)} 0.2s;
    transform: scale(1.1);
  }
  &:active {
    animation: ${() => clickFx(0.1)} 0.3s;
  }

  color: black;
  font-size: 0.8vw;
  text-align: center;
`;
