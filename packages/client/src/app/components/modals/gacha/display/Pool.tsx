import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { KamiBlock } from './KamiBlock';

interface Props {
  lazyKamis: Array<() => Kami>;
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { lazyKamis } = props;
  const { modals } = useVisibility();
  const [numShown, setNumShown] = useState<number>(0);

  useEffect(() => {
    if (modals.gacha) setNumShown(49);
    else setNumShown(0);
  }, [modals.gacha]);

  //////////////////
  // LOGIC

  const getKamiText = (kami: Kami): string[] => {
    return [
      `Health: ${kami.stats.health.base}`,
      `Power: ${kami.stats.power.base}`,
      `Violence: ${kami.stats.violence.base}`,
      `Harmony: ${kami.stats.harmony.base}`,
      `Slots: ${kami.stats.slots.base}`,
    ];
  };

  const getTruncatedKamis = () => {
    const amt = numShown < lazyKamis.length ? numShown : lazyKamis.length;
    const shortLazies = [...lazyKamis].splice(0, amt);

    return shortLazies.map((lazyKami) => lazyKami());
  };

  ///////////////////
  // DISPLAY

  return (
    <OuterBox style={{ display: props.isVisible ? 'flex' : 'none' }}>
      {getTruncatedKamis().map((kami) => (
        <Tooltip key={kami.index} text={getKamiText(kami)}>
          <KamiBlock key={kami.index} kami={kami} />
        </Tooltip>
      ))}
    </OuterBox>
  );
};

const OuterBox = styled.div`
  background-color: white;
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;
