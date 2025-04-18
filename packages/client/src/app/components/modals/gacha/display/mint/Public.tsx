import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config/gacha';
import { Overlay, Pairing, Tooltip } from 'app/components/library';
import { ProgressBar } from 'app/components/library/base';
import { depressFx } from 'app/styles/effects';
import { ItemImages } from 'assets/images/items';
import { GachaMintData } from 'network/shapes/Gacha';
import { playClick } from 'utils/sounds';
import { formatCountdown, getDateString } from 'utils/time';
import { ViewMode } from '../../types';

const GACHA_TICKET_IMAGE = ItemImages.gacha_ticket;
const TOTAL = 3000;

interface Props {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
  };
  data: {
    mintConfig: GachaMintConfig;
    gachaData: GachaMintData;
  };
  state: {
    tick: number;
  };
}

export const Public = (props: Props) => {
  const { controls, data, state } = props;
  const { mode, setMode } = controls;
  const { mintConfig, gachaData } = data;
  const { tick } = state;

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setCountdown(mintConfig.public.startTs - tick / 1000);
  }, [tick]);

  /////////////////
  // HANDLERS

  // handle a click on this section
  const handleClick = () => {
    setMode('ALT');
    playClick();
  };

  const getStatusText = () => {
    return `${gachaData.total}/${mintConfig.total}`;
  };

  const getCountdownText = () => {
    if (countdown > 0) return formatCountdown(countdown);
    return '00:00:00';
  };

  const getCountdownTooltip = () => {
    const startStr = getDateString(mintConfig.public.startTs, 0);

    if (countdown > 0) {
      return [`Public Mint starts`, `at ${startStr}`];
    }
    return [`Public Mint started`, `at ${startStr}`];
  };

  return (
    <Container isSelected={mode === 'ALT'} onClick={handleClick}>
      <Overlay top={0.9} right={0.9}>
        <Tooltip text={getCountdownTooltip()}>
          <Text size={0.9}>{getCountdownText()}</Text>
        </Tooltip>
      </Overlay>
      <Section>
        <Text size={1.8}>Public Mint</Text>
        <Text size={0.9}>limit 5 per customer (⌐■_■) </Text>
      </Section>
      <Tooltip text={[`You're probably hoping these`, `don't mint out :3`]}>
        <Section>
          <Pairing icon={GACHA_TICKET_IMAGE} text={getStatusText()} reverse />
          <ProgressBar
            total={TOTAL}
            current={gachaData.total}
            width={16}
            colors={{ background: '#fff', progress: '#3DE167' }}
          />
        </Section>
      </Tooltip>
    </Container>
  );
};

const Container = styled.div<{ isSelected: boolean }>`
  border-radius: 1.2vw;
  background-color: ${({ isSelected }) => (isSelected ? '#9c9' : 'white')};
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
  gap: 0.3vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
