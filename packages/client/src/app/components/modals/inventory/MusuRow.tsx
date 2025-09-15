import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { TradeIcon } from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { Mode } from './types';

// get the row of consumable items to display in the player inventory
export const MusuRow = ({
  data,
  state,
}: {
  data: {
    musu: number;
    obols: number;
  };
  state: {
    mode: Mode;
    setMode: (mode: Mode) => void;
    setShuffle: (suffle: boolean) => void;
  };
}) => {
  const { modals, setModals } = useVisibility();
  const { musu, obols } = data;
  const { mode, setMode, setShuffle } = state;

  const [displayMusu, setDisplayMusu] = useState<number>(musu);
  const animationRef = useRef<number | null>(null);
  const stepTimeRef = useRef<number | null>(null);
  const prevMusuRef = useRef<number>(musu);

  // animate the musu balance, eased to the target value
  useEffect(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    stepTimeRef.current = null;
    const from = prevMusuRef.current;
    const to = musu;

    // don't animate if the musu balance difference is low
    if (Math.abs(to - from) < 10) {
      prevMusuRef.current = musu;
      setDisplayMusu(to);
      return;
    }

    // animation step
    const step = (t: number) => {
      if (stepTimeRef.current == null) stepTimeRef.current = t;
      const elapsed = t - stepTimeRef.current;
      const progress = Math.min(1, elapsed / 750); // elapsed divided by tick duration
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      setDisplayMusu(value);
      if (progress < 1) animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    prevMusuRef.current = musu;

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [musu]);

  /////////////////
  // INTERACTION

  // toggles views and activates the shuffle animation
  const triggerModalShuffle = () => {
    setMode(mode === 'STOCK' ? 'TRANSFER' : 'STOCK');
    setTimeout(() => setShuffle(true), 100);
    setTimeout(() => setShuffle(false), 500);
  };

  /////////////////
  // RENDER

  return (
    <Container key='musu'>
      <Icons>
        <TextTooltip
          text={[
            'View the Kamigotchi World Orderbook\n\n',
            'You must be in a designated Trade room',
            'to interact with outstanding Orders.',
          ]}
          direction='row'
        >
          <IconButton
            img={TradeIcon}
            onClick={() => setModals({ ...modals, trading: !modals.trading })}
            radius={0.9}
          />
        </TextTooltip>
        <IconButton
          img={ItemImages.obol}
          onClick={() => setModals({ ...modals, lootBox: !modals.lootBox })}
          radius={0.9}
        />
        <TextTooltip
          text={mode === 'TRANSFER' ? ['Back to Inventory'] : ['Send Item']}
          direction='row'
        >
          <IconButton
            img={mode === 'TRANSFER' ? ArrowIcons.left : ArrowIcons.right}
            onClick={() => triggerModalShuffle()}
            radius={0.9}
          />
        </TextTooltip>
      </Icons>
      <TextTooltip text={['MUSU']} direction='row' fullWidth>
        <MusuSection>
          <Icon src={ItemImages.musu} onClick={() => null} />
          <Balance>{displayMusu.toLocaleString()}</Balance>
        </MusuSection>
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.45vw;
  gap: 0.45vw;

  user-select: none;
  display: flex;
  flex-flow: row no-wrap;
  justify-content: space-between;
  align-items: center;
`;

const MusuSection = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3vw;
`;

const Icons = styled.div`
  display: flex;
  flex-flow: row nowrap;
  gap: 0.3vw;
`;

const Icon = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  margin-top: 0.12vw;
`;

const Balance = styled.div`
  border: solid #333 0.15vw;
  border-radius: 0.6vw 0 0.6vw 0.6vw;
  padding: 0.3vw;
  width: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;

  color: black;
  font-size: 0.9vw;
  line-height: 1.2vw;
`;
