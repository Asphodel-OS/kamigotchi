import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

export const WorldKamis = ({
  kamis,
  state,
}: {
  kamis: Kami[];
  state: {
    selectedWorld: Kami[];
    setSelectedWorld: (kamis: Kami[]) => void;
    selectedWild?: Kami[];
  };
}) => {
  const { selectedWorld, setSelectedWorld, selectedWild } = state;
  const [displayed, setDisplayed] = useState<Kami[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(50);

  useEffect(() => {
    setDisplayed(kamis);
  }, [kamis, selectedWorld]);

  useEffect(() => {
    setVisibleCount(50);
  }, [kamis.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 20;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
        setVisibleCount((c) => Math.min(c + 50, displayed.length));
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [displayed.length]);

  /////////////////
  // HANDLERS

  const handleSelect = (kami: Kami) => {
    playClick();
    if (selectedWorld.includes(kami)) {
      setSelectedWorld(selectedWorld.filter((k) => k !== kami));
    } else {
      setSelectedWorld([...selectedWorld, kami]);
    }
  };

  /////////////////
  // INTERPRETATION

  const isDisabled = (kami: Kami) => {
    return (selectedWild?.length ?? 0) > 0;
  };

  const getCount = () => {
    return `${kamis.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} fullWidth orientation='column' gap={0.4}>
        <Text size={0.9}>World({getCount()})</Text>
        <IconButton
          onClick={() => {
            setSelectedWorld(kamis);
          }}
          text={'Select All'}
          disabled={(selectedWild?.length ?? 0) > 0 || selectedWorld.length === kamis.length}
        />
      </Overlay>
      <Scrollable ref={containerRef}>
        {displayed.slice(0, visibleCount).map((kami) => (
          <KamiBlock
            key={kami.index}
            tooltip={(selectedWild?.length ?? 0) > 0 ? ['Only imports or exports at a time'] : []}
            kami={kami}
            select={{
              isDisabled: isDisabled(kami),
              isSelected: selectedWorld.includes(kami),
              onClick: () => handleSelect(kami),
            }}
          />
        ))}
      </Scrollable>
      {visibleCount < displayed.length && (
        <Loading>Loading more Kami…</Loading>
      )}
      <Overlay fullWidth fullHeight passthrough>
        <EmptyText
          size={1}
          text={['You have no Kami', 'in the world']}
          isHidden={!!displayed.length}
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 40%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
`;

const Scrollable = styled.div`
  display: flex;
  flex-flow: row;
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 5vw;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Loading = styled.div`
  text-align: center;
  color: #666;
  padding: 0.6vw 0;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
`;
