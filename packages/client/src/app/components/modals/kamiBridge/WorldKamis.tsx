import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
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
    selectedWorld: Kami[];
    setSelectedWorld: (kamis: Kami[]) => void;
    selectedWild?: Kami[];
  };
}

export const WorldKamis = (props: Props) => {
  const { kamis, state, mode } = props;
  const { world, wild } = kamis;
  const { selectedWorld, setSelectedWorld, selectedWild } = state;
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    setDisplayed(world);
  }, [mode, world, selectedWorld]);

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
    return (selectedWild?.length ?? 0) > 0 || !isResting(kami);
  };

  const getEmptyText = () => {
    if (mode === 'EXPORT') return ['You have no Kami', 'in the world'];
    else return ['You must select', 'some Kami'];
  };

  const getCount = () => {
    return `${world.length}`;
    //return `${world.length}+${selected.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} fullWidth>
        <Text size={0.9}>World({getCount()})</Text>
      </Overlay>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            select={{
              isDisabled: isDisabled(kami),
              // isSelected: mode === 'IMPORT',
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
  height: 100%;
  display: flex;
  flex-flow: row;
  overflow-y: scroll;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2.5vw;
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
