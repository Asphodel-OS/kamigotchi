import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
import { playClick } from 'utils/sounds';
import { KamiBlock } from './KamiBlock';

interface Props {
  lazyKamis: Array<() => Kami>;
  isVisible: boolean;
}

export const Pool = (props: Props) => {
  const { lazyKamis } = props;
  const { kamiIndex, setKami } = useSelected();
  const { modals, setModals } = useVisibility();
  const [numShown, setNumShown] = useState<number>(0);

  useEffect(() => {
    if (modals.gacha) setNumShown(49);
    else setNumShown(0);
  }, [modals.gacha]);

  //////////////////
  // LOGIC

  const kamiOnClick = (kami: BaseKami) => {
    const sameKami = kamiIndex === kami.index;
    setKami(kami.index);

    if (modals.kami && sameKami) setModals({ ...modals, kami: false });
    else setModals({ ...modals, kami: true });
    playClick();
  };

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
    <Container style={{ display: props.isVisible ? 'flex' : 'none' }}>
      {getTruncatedKamis().map((kami) => (
        <Tooltip key={kami.index} text={getKamiText(kami)}>
          <KamiBlock key={kami.index} kami={kami} onClick={() => kamiOnClick(kami)} />
        </Tooltip>
      ))}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`;
