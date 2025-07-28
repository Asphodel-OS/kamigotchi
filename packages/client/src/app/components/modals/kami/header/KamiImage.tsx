import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { TextTooltip } from 'app/components/library';
import { LevelUpArrows } from 'app/components/library/animations/LevelUp';
import { Overlay } from 'app/components/library/styles';
import { useSelected, useVisibility } from 'app/stores';
import { clickFx, hoverFx, Shimmer } from 'app/styles/effects';
import { IndicatorIcons } from 'assets/images/icons/indicators';
import { Account, BaseAccount } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
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
  const { levelUp } = actions;
  const { account, kami, owner } = data;
  const { calcExpRequirement } = utils;
  const { setKami } = useSelected();
  const { modals } = useVisibility();

  const [isSearching, setIsSearching] = useState(false);
  const [indexInput, setIndexInput] = useState(kami.index);

  useEffect(() => {
    if (modals.kami) setIsSearching(false);
  }, [modals.kami]);

  const progress = kami.progress!;
  const expCurr = progress.experience;
  const expLimit = progress ? calcExpRequirement(progress.level) : 40;
  const percentage = Math.floor((expCurr / expLimit) * 1000) / 10;

  const getLevelTooltip = () => {
    if (owner.index != account.index) return 'not ur kami';
    if (expCurr < expLimit) return 'not enough experience';
    if (!isResting(kami)) return 'kami must be resting';
    return LEVEL_UP_STRING;
  };

  /////////////////
  // INTERACTION

  const handleLevelUp = () => {
    levelUp(kami);
    playClick();
  };

  const handleIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, rawQuantity);
    setIndexInput(quantity);
  };

  const handleIndexClick = () => {
    setIndexInput(kami.index);
    setIsSearching(true);
    playClick();
  };

  const handleIndexSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setKami(indexInput);
      setIsSearching(false);
      playClick();
    }
  };

  const canLevel = getLevelTooltip() === LEVEL_UP_STRING;

  /////////////////
  // RENDERING

  // used expCurr >= expLimit and not canLevel to show the level up animation even when not resting
  return (
    <Container>
      <Image src={kami.image} />
      {expCurr >= expLimit && <LevelUpArrows />}
      <Overlay top={0.75} left={0.7}>
        <Grouping>
          <Text size={0.6}>Lvl</Text>
          <Text size={0.9}>{progress ? progress.level : '??'}</Text>
        </Grouping>
      </Overlay>
      <Overlay top={1.95} left={0.7}>
        {!isSearching && (
          <Text size={0.9} onClick={handleIndexClick}>
            {kami.index}
          </Text>
        )}
        {isSearching && (
          <IndexInput
            type={'string'}
            value={indexInput}
            onChange={handleIndexChange}
            onKeyDown={handleIndexSubmit}
          />
        )}
      </Overlay>
      <Overlay top={1} right={1}>
        {(kami.skills?.points ?? 0) > 0 && <Sp>SP</Sp>}
      </Overlay>
      <Overlay bottom={0} fullWidth>
        <TextTooltip text={[`${expCurr}/${expLimit}`]} grow>
          <ExperienceBar percent={percentage}></ExperienceBar>
        </TextTooltip>
        <Percentage>{`${Math.min(percentage, 100)}%`}</Percentage>
        <Overlay bottom={0} right={0}>
          <TextTooltip text={[getLevelTooltip()]}>
            <Button disabled={!canLevel} onClick={() => handleLevelUp()}>
              <Arrow src={IndicatorIcons.level_up} />
              {canLevel && <Shimmer />}
            </Button>
          </TextTooltip>
        </Overlay>
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 18vw;
  margin: 0.6vw 0 0.6vw 0.6vw;
  overflow: hidden;
`;

const Image = styled.img`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  height: 100%;
  image-rendering: pixelated;
  user-drag: none;
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
  line-height: ${(props) => props.size * 1.5}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.5}vw black`};

  &:hover {
    opacity: 0.8;
    cursor: pointer;
  }
`;

const IndexInput = styled.input`
  border: none;
  background-color: #eee;
  width: 4.5vw;
  cursor: text;

  color: black;
  font-size: 0.9vw;
  line-height: 1.35vw;
  text-align: center;
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
  user-select: none;
`;

const Arrow = styled.img`
  width: 1.2vw;
  height: 1.2vw;
`;

const Sp = styled.div`
  position: absolute;
  right: 4%;
  top: 4%;
  font-size: 2vw;
  font-weight: bold;
  background: linear-gradient(to right, #0b0d0eff, #ee0979);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
