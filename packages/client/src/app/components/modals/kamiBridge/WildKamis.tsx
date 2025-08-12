import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';
import { Mode } from './types';

interface Props {
  mode: Mode;
  kamis: {
    wild: Kami[];
    world: Kami[];
  };
  state: {
    selectedWild: Kami[];
    setSelectedWild: (kamis: Kami[]) => void;
    selectedWorld?: Kami[];
  };
}

export const WildKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { world, wild } = kamis;
  const { selectedWild, setSelectedWild, selectedWorld } = state;
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    setDisplayed(wild);
  }, [mode, wild, selectedWild]);

  /////////////////
  // HANDLERS

  const handleSelect = (kami: Kami) => {
    playClick();
    if (selectedWild.includes(kami)) {
      setSelectedWild(selectedWild.filter((k) => k !== kami));
    } else {
      setSelectedWild([...selectedWild, kami]);
    }
  };

  /////////////////
  // INTERPRETATION

  const getEmptyText = () => {
    return ['You have no Kami', 'in the wild'];
  };

  const getCount = () => {
    return `${wild.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} fullWidth orientation='column' gap={0.4}>
        <Text size={0.9}>Wilderness({getCount()})</Text>
        <IconButton
          onClick={() => {
            setSelectedWild(wild);
          }}
          text={'Select All'}
          disabled={(selectedWorld?.length ?? 0) > 0 || selectedWild.length === wild.length}
        />
      </Overlay>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            tooltip={(selectedWorld?.length ?? 0) > 0 ? ['Only imports or exports at a time'] : []}
            select={{
              isSelected: selectedWild.includes(kami),
              isDisabled: (selectedWorld?.length ?? 0) > 0,
              onClick: () => handleSelect(kami),
            }}
          />
        ))}
      </Scrollable>
      <Overlay fullWidth fullHeight passthrough>
        <EmptyText text={getEmptyText()} size={1} isHidden={!!displayed.length} />
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
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
