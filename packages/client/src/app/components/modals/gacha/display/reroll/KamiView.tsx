import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { KamiBlock } from '../KamiBlock';

interface Props {
  data: {
    accountEntity: EntityIndex;
  };
  state: {
    setQuantity: (balance: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (chosenOnes: Kami[]) => void;
    tick: number;
  };
  utils: {
    getAccountKamis: () => Kami[];
  };
  isVisible: boolean;
}

export const KamiView = (props: Props) => {
  const { data, state, utils, isVisible } = props;
  const { accountEntity } = data;
  const { setQuantity, selectedKamis, setSelectedKamis, tick } = state;
  const { getAccountKamis } = utils;
  const { modals } = useVisibility();

  const [partyKamis, setPartyKamis] = useState<Kami[]>([]);

  // update the list of kamis when the account changes (if visible)
  useEffect(() => {
    if (!isVisible || !modals.gacha) return;
    const party = getAccountKamis();
    setPartyKamis(party);
  }, [accountEntity, tick]);

  /////////////////
  // INTERACTION

  // select or deselect a kami
  const handleSelect = (kami: Kami) => {
    if (kami.state !== 'RESTING') return;

    let newSelected = [];
    if (selectedKamis.includes(kami)) {
      newSelected = selectedKamis.filter((k) => k !== kami);
    } else {
      newSelected = [...selectedKamis, kami];
    }
    setQuantity(newSelected.length);
    setSelectedKamis(newSelected);
  };

  /////////////////
  // INTERPRETATION

  // determines whether a kami can be rerolled
  const canReroll = (kami: Kami) => {
    return kami.state === 'RESTING';
  };

  // get the tooltip of a kami based on state and reroll selection
  // maybe make the flavor text more randomized
  const getKamiTooltip = (kami: Kami): string[] => {
    if (selectedKamis.includes(kami)) return [`${kami.name} never liked you anyway..`];
    if (kami.state !== 'RESTING') {
      return [`${kami.name} is ${kami.state}`, '> only RESTING kamis can be rerolled'];
    }
    return [`Reroll ${kami.name} ?`];
  };

  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      {partyKamis.map((kami) => (
        <Tooltip key={kami.index} text={getKamiTooltip(kami)}>
          <KamiBlock
            kami={kami}
            select={{ isDisabled: !canReroll(kami), isSelected: selectedKamis.includes(kami) }}
            onClick={() => handleSelect(kami)}
          />
        </Tooltip>
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;

  overflow-y: scroll;
`;
