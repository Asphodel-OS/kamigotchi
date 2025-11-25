import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

export const WorldKamis = ({
  kamis,
  state: { selectedWorld, setSelectedWorld, selectedWild },
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
  // RENDER

  return (
    <Container>
      <Header>
        <Text size={0.9}>World</Text>
        <IconButton
          onClick={() => {
            setSelectedWorld(kamis);
          }}
          text={`Select All (${kamis.length})`}
          disabled={(selectedWild?.length ?? 0) > 0 || selectedWorld.length === kamis.length}
        />
      </Header>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            tooltip={(selectedWild?.length ?? 0) > 0 ? ['Only imports or exports at a time'] : []}
            kami={kami}
            select={{
              isDisabled: (selectedWild?.length ?? 0) > 0,
              isSelected: selectedWorld.includes(kami),
              onClick: () => handleSelect(kami),
            }}
          />
        ))}
      </Scrollable>
      <EmptyText
        size={1}
        text={['You have no Kami', 'in the world']}
        isHidden={!!displayed.length}
      />
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

const Header = styled.div`
  position: sticky;
  top: 0;

  padding: 0.6vw;
  background-color: rgb(238, 238, 238);
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: center;

  font-size: 0.9vw;
  line-height: 1.5vw;
  text-align: center;
`;

const Scrollable = styled.div`
  display: flex;
  flex-flow: row;
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
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
