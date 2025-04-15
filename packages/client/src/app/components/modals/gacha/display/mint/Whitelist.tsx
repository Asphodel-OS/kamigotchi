import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Overlay, Pairing, Tooltip } from 'app/components/library';
import { ProgressBar } from 'app/components/library/base';
import { depressFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { playClick } from 'utils/sounds';
import { formatCountdown, getDateString } from 'utils/time';
import { ViewMode } from '../../types';

const GACHA_TICKET_IMAGE = ItemImages.gacha_ticket;
const START_TIME = Date.now() / 1000 + 3600;
const TOTAL = 3333;

interface Props {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
  };
  state: {
    tick: number;
  };
  claimed: number;
}

export const Whitelist = (props: Props) => {
  const { controls, state, claimed } = props;
  const { mode, setMode } = controls;
  const { tick } = state;

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setCountdown(START_TIME - tick / 1000);
  }, [tick]);

  /////////////////
  // HANDLERS

  // handle a click on this section
  const handleClick = () => {
    setMode('DEFAULT');
    playClick();
  };

  const getStatusText = () => {
    return `${claimed}/${TOTAL}`;
  };

  const getCountdownText = () => {
    if (countdown > 0) return formatCountdown(countdown);
    return '00:00:00';
  };

  const getCountdownTooltip = () => {
    const startStr = getDateString(START_TIME, 0);

    if (countdown > 0) {
      return [`Whitelist Mint starts`, `at ${startStr}`];
    }
    return [`Whitelist Mint started`, `at ${startStr}`];
  };

  return (
    <Container isSelected={mode === 'DEFAULT'} onClick={handleClick}>
      <Overlay top={0.9} right={0.9}>
        <Tooltip text={getCountdownTooltip()}>
          <Text size={0.9}>{getCountdownText()}</Text>
        </Tooltip>
      </Overlay>
      <Section>
        <Text size={1.8}>Whitelist Mint</Text>
        <Text size={0.9}>limit 1 per customer ^^</Text>
      </Section>
      <Section>
        <Pairing icon={GACHA_TICKET_IMAGE} text={getStatusText()} reverse />
        <ProgressBar
          total={TOTAL}
          current={claimed}
          width={16}
          colors={{ background: '#fff', progress: '#3DE167' }}
        />
      </Section>
    </Container>
  );
};

const Container = styled.div<{ isSelected: boolean }>`
  border-radius: 1.2vw;
  background-color: ${({ isSelected }) => (isSelected ? 'white' : '#9c9')};
  filter: drop-shadow(0.3vw 0.3vw 0.15vw black);
  height: 18vw;
  width: 24vw;
  padding: 1.2vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  justify-content: space-around;

  user-select: none;
  cursor: pointer;
  &:active {
    animation: ${() => depressFx(0.2)} 0.2s;
  }
`;

const Section = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
