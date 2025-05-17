import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';
import { Mode } from './types';

interface Props {
  mode: Mode;
  kamis: Kami[];
  state: {
    selected: Kami[];
    setSelected: (kamis: Kami[]) => void;
  };
}

export const WildKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { selected, setSelected } = state;
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>([]);

  useEffect(() => {
    if (mode === 'EXPORT') setDisplayedKamis(selected);
    else {
      const remainingKamis = kamis.filter((kami) => !selected.includes(kami));
      setDisplayedKamis(remainingKamis);
    }
  }, [mode, kamis, selected]);

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
    if (mode === 'IMPORT') return kamis.length - selected.length;
    else return selected.length;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} left={0.9}>
        <Text size={0.9}>Wilderness({getCount()})</Text>
      </Overlay>
      <Scrollable>
        {displayedKamis.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            select={{ isSelected: mode === 'EXPORT', onClick: () => handleSelect(kami) }}
          />
        ))}
      </Scrollable>
      <Overlay fullWidth fullHeight passthrough>
        <EmptyText text={getEmptyText()} size={1} isHidden={!!displayedKamis.length} />
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
