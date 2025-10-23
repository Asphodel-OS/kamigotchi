import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';

export const WildKamis = ({
  kamis,
  state: { selectedWild, setSelectedWild, selectedWorld },
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
  // RENDER

  return (
    <Container>
      <Header>
        <Text size={0.9}>Wilderness</Text>
        <IconButton
          onClick={() => {
            setSelectedWild(kamis);
          }}
          text={`Select All (${kamis.length})`}
          disabled={(selectedWorld?.length ?? 0) > 0 || selectedWild.length === kamis.length}
        />
      </Header>
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
      <EmptyText
        text={['You have no Kami', 'in the wild']}
        size={1}
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
