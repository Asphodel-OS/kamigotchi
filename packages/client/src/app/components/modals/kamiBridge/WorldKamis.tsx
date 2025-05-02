import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
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

export const WorldKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { selectedKamis, setSelectedKamis } = state;
  const [displayedKamis, setDisplayedKamis] = useState<Kami[]>([]);

  useEffect(() => {
    if (mode === 'EXPORT') {
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

  return (
    <Container>
      <Overlay top={0.9} right={0.9}>
        <Text size={0.9}>{kamis.length} World</Text>
      </Overlay>
      <Scrollable>
        {displayedKamis.map((kami) => {
          return <KamiBlock key={kami.index} kami={kami} onClick={() => handleClick(kami)} />;
        })}
      </Scrollable>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  background-color: blue;
  width: 100%;
  height: 12vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Scrollable = styled.div`
  height: 100%;
  display: flex;
  flex-flow: row nowrap;
  overflow-x: scroll;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.5}vw;
`;
