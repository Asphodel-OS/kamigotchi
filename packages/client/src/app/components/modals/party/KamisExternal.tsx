import styled from 'styled-components';

import { KamiBlockMini } from 'app/components/library';
import { EntityIndex } from 'engine/recs';
import { Kami } from 'network/shapes/Kami';
import { View } from './types';

// resorting to this pattern as useMemo and useCallback don't seem to be effective
const KamiBlocks = new Map<EntityIndex, JSX.Element>();

export const KamisExternal = ({
  data: { kamis },
  isVisible,
}: {
  controls: {
    view: View;
  };
  data: {
    kamis: Kami[];
  };
  isVisible: boolean;
}) => {
  // const handleSelect = (kami: Kami) => {
  //   const sameKami = selected.includes(kami);
  //   if (sameKami) setSelected(selected.filter((k) => k !== kami));
  //   else setSelected([...selected, kami]);
  // };

  // get the react component of a KamiBlock, falling back on the cache
  const getKamiBlock = (kami: Kami) => {
    const entity = kami.entity;
    if (!KamiBlocks.has(entity)) {
      const tooltip = [`${kami.name} `, `#${kami.index} (Lvl${kami.progress?.level ?? '???'})`];
      KamiBlocks.set(entity, <KamiBlockMini key={kami.index} kami={kami} tooltip={tooltip} />);
    }
    return KamiBlocks.get(entity)!;
  };

  /////////////////
  // RENDER

  return <Container isVisible={isVisible}>{kamis.map((kami) => getKamiBlock(kami))}</Container>;
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  align-items: center;
  justify-content: space-around;

  padding: 0.6vw;
  gap: 0.6vw;
`;
