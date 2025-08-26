import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isResting } from 'app/cache/kami';
import { EmptyText, Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { KamiBlock } from '../../library/KamiBlock';
import { Mode } from './types';

export const WorldKamis = ({
  kamis,
  state,
  mode,
}: {
  mode: Mode;
  kamis: {
    wild: Kami[];
    world: Kami[];
  };
  state: {
    selected: Kami[];
    setSelected: (kamis: Kami[]) => void;
  };
}) => {
  const { world, wild } = kamis;
  const { selected, setSelected } = state;
  const [displayed, setDisplayed] = useState<Kami[]>([]);

  useEffect(() => {
    if (mode === 'IMPORT') setDisplayed(selected);
    else {
      const remaining = world.filter((kami) => !selected.includes(kami));
      setDisplayed(remaining);
    }
  }, [mode, world, selected]);

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

  const isDisabled = (kami: Kami) => {
    return mode === 'EXPORT' && !isResting(kami);
  };

  const getEmptyText = () => {
    if (mode === 'EXPORT') return ['You have no Kami', 'in the world'];
    else return ['You must select', 'some Kami'];
  };

  const getCount = () => {
    if (mode === 'EXPORT') return `${world.length}`;
    else return `${world.length}+${selected.length}`;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Overlay top={0.9} left={0.9}>
        <Text size={0.9}>World({getCount()})</Text>
      </Overlay>
      <Scrollable>
        {displayed.map((kami) => (
          <KamiBlock
            key={kami.index}
            kami={kami}
            select={{
              isDisabled: isDisabled(kami),
              isSelected: mode === 'IMPORT',
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
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
`;
