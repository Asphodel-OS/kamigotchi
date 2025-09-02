import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

export const WildKamis = ({
  kamis,
  state: {
    selectedWild,
    setSelectedWild,
    selectedWorld,
  },
}: {
  kamis: Kami[];
  state: {
    selectedWild: Kami[];
    setSelectedWild: React.Dispatch<React.SetStateAction<Kami[]>>;
    selectedWorld?: Kami[];
  };
}) => {
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    setDisplayed(kamis);
  }, [kamis, selectedWild]);

  /////////////////
  // HANDLERS

  const handleSelect = (kami: Kami) => {
    playClick();
    setSelectedWild((prev: Kami[]): Kami[] => {
      const exists = prev.some((k) => k.index === kami.index);
      return exists ? prev.filter((k) => k.index !== kami.index) : [...prev, kami];
    });
  };

  /////////////////
  // INTERPRETATION

  const getCount = () => {
    return `${kamis.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} fullWidth orientation='column' gap={0.4}>
        <Text size={0.9}>Wilderness({getCount()})</Text>
        <IconButton
          onClick={() => {
            setSelectedWild(kamis);
          }}
          text={'Select All'}
          disabled={(selectedWorld?.length ?? 0) > 0 || selectedWild.length === kamis.length}
        />
      </Overlay>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            tooltip={(selectedWorld?.length ?? 0) > 0 ? ['Only imports or exports at a time'] : []}
            select={{
              isSelected: selectedWild.some((k) => k.index === kami.index),
              isDisabled: (selectedWorld?.length ?? 0) > 0,
              onClick: () => handleSelect(kami),
            }}
          />
        ))}
      </Scrollable>
      <Overlay fullWidth fullHeight passthrough>
        <EmptyText
          text={['You have no Kami', 'in the wild']}
          size={1}
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
  margin-top: 5em;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 1.5}em;
`;
