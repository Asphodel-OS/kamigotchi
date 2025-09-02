import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config/gacha';
import { Overlay, Pairing, TextTooltip } from 'app/components/library';
import { depressFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { KamiImages } from 'assets/images/kamis';
import { GachaMintData } from 'network/shapes/Gacha';
import { playClick } from 'utils/sounds';
import { formatCountdown, getDateString } from 'utils/time';
import { ViewMode } from '../../types';

const GACHA_TICKET_IMAGE = ItemImages.gacha_ticket;
const START_TIME = Date.now() / 1000 + 3600;

export const Whitelist = ({
  controls,
  data,
  state,
}: {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
  };
  data: {
    mint: {
      config: GachaMintConfig;
      data: {
        account: GachaMintData;
        gacha: GachaMintData;
      };
      whitelisted: boolean;
    };
  };
  state: {
    tick: number;
  };
}) => {
  const { mode, setMode } = controls;
  const {
    config,
    data: { gacha: gachaData },
  } = data.mint;
  const { tick } = state;

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setCountdown(config.whitelist.startTs - tick / 1000);
  }, [tick]);

  /////////////////
  // HANDLERS

  // handle a click on this section
  const handleClick = () => {
    setMode('DEFAULT');
    playClick();
  };

  /////////////////
  // INTERPRETATION

  // get the total minted out of the total whitelisted
  const getStatusText = () => {
    return `${gachaData.whitelist} claimed`;
  };

  // get the text for the countdown
  const getCountdownText = () => {
    if (countdown > 0) return formatCountdown(countdown);
    return '00:00:00';
  };

  // get the tooltip for the countdown
  const getCountdownTooltip = () => {
    const startStr = getDateString(START_TIME, 0);

    if (countdown > 0) {
      return [`Whitelist Mint starts`, `at ${startStr}`];
    }
    return [`Whitelist Mint started`, `at ${startStr}`];
  };

  const isWhitelisted = () => {
    return data.mint.whitelisted;
  };

  const getWhitelistText = () => {
    if (isWhitelisted()) return `Don't worry pookie, you've got WL ;)`;
    else return `You're not whitelisted. Skill issue?`;
  };

  /////////////////
  // DISPLAY

  return (
    <Container isSelected={mode === 'DEFAULT'} onClick={handleClick}>
      <Overlay top={0.9} right={0.9}>
        <TextTooltip text={getCountdownTooltip()}>
          <Text size={0.9}>{getCountdownText()}</Text>
        </TextTooltip>
      </Overlay>
      <Section>
        <Text size={1.8}>Whitelist Mint</Text>
        <Text size={0.9}>limit {config.whitelist.max} per customer ^^</Text>
      </Section>
      <Image src={KamiImages.lethe} selected={mode === 'DEFAULT'} />
      <Section>
        <Pairing icon={GACHA_TICKET_IMAGE} text={getStatusText()} />
        <Text size={0.6}>{getWhitelistText()}</Text>
      </Section>
    </Container>
  );
};

const Container = styled.div<{ isSelected: boolean }>`
  border-radius: 1.2em;
  background-color: ${({ isSelected }) => (isSelected ? '#9c9' : 'white')};
  filter: drop-shadow(0.3em 0.3em 0.15em black);
  width: 24em;
  padding: 2.1em;
  gap: 0.6em;
  z-index: 5;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-around;

  user-select: none;
  cursor: pointer;
  &:hover {
    ${({ isSelected }) => !isSelected && 'opacity: 0.8;'}
  }
  &:active {
    animation: ${() => depressFx(0.2)} 0.2s;
  }
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 1.5}em;
`;

const Image = styled.img<{ selected: boolean }>`
  border-radius: 0.6em;
  height: 10em;
  width: 10em;
  image-rendering: pixelated;
  opacity: ${({ selected }) => (selected ? 1 : 0.6)};
`;
