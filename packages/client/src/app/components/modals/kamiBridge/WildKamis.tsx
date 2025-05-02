import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EmptyText, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../gacha/display/KamiBlock';
import { Mode } from './types';

interface Props {
  mode: Mode;
  kamis: Kami[];
  state: {
    selectedKamis: Kami[];
    setSelectedKamis: (kamis: Kami[]) => void;
  };
}

export const WildKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { selectedKamis, setSelectedKamis } = state;
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>([]);

  useEffect(() => {
    if (mode === 'IMPORT') {
      const remainingKamis = kamis.filter((kami) => !selectedKamis.includes(kami));
      setDisplayedKamis(remainingKamis);
    } else {
      setDisplayedKamis(selectedKamis);
    }
  }, [mode, selectedKamis]);

  const handleClick = (kami: Kami) => {
    playClick();
    if (selectedKamis.includes(kami)) {
      setSelectedKamis(selectedKamis.filter((k) => k !== kami));
    } else {
      setSelectedKamis([...selectedKamis, kami]);
    }
  };

  const getEmptyText = () => {
    if (mode === 'IMPORT') return ['You have no Kami', 'in the wild'];
    else return ['You must select', 'some Kami'];
  };

  return (
    <Container>
      <Overlay top={0.9} left={0.9}>
        <Text size={0.9}>Wilderness</Text>
      </Overlay>
      <Scrollable>
        {displayedKamis.map((kami) => (
          <KamiBlock key={kami.index} kami={kami} onClick={() => handleClick(kami)} />
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
  height: 18vw;
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
