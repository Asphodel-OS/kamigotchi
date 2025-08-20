import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Overlay } from 'app/components/library';
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
    selected: Kami[];
    setSelected: (kamis: Kami[]) => void;
  };
}

export const WildKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { world, wild } = kamis;
  const { selected, setSelected } = state;
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    if (mode === 'EXPORT') setDisplayed(selected);
    else {
      const remainingKamis = wild.filter((kami) => !selected.includes(kami));
      setDisplayed(remainingKamis);
    }
  }, [mode, wild, selected]);

  /////////////////
  // HANDLERS

  const handleSelect = (kami: Kami) => {
    playClick();
    if (selected.includes(kami)) {
      setSelected(selected.filter((k) => k !== kami));
    } else {
      setSelected([...selected, kami]);
    }
  };

  /////////////////
  // INTERPRETATION

  const getEmptyText = () => {
    if (mode === 'IMPORT') return ['You have no Kami', 'in the wild'];
    else return ['You must select', 'some Kami'];
  };

  const getCount = () => {
    if (mode === 'IMPORT') return `${wild.length}`;
    else return `${wild.length}+${selected.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} left={0.9}>
        <Text size={0.9}>Wilderness({getCount()})</Text>
      </Overlay>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            select={{ isSelected: mode === 'EXPORT', onClick: () => handleSelect(kami) }}
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
  width: 100%;
  height: 15vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Scrollable = styled.div`
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  overflow-x: scroll;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
