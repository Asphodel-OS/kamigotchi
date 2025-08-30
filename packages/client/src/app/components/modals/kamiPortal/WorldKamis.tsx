import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

export const WorldKamis = ({
  kamis,
  state: {
    selectedWorld,
    setSelectedWorld,
    selectedWild,
  },
}: {
  kamis: Kami[];
  state: {
    selectedWorld: Kami[];
    setSelectedWorld: (kamis: Kami[]) => void;
    selectedWild?: Kami[];
  };
}) => {
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    setDisplayed(kamis);
  }, [kamis, selectedWorld]);

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
      <Scrollable>
        {displayed.map((kami) => (
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

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
`;
