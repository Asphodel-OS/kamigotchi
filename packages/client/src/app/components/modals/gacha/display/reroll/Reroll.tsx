import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { TabType } from '../../types';
import { KamiBlock } from '../KamiBlock';
import { KamiGrid } from './KamiGrid';

interface Props {
  actions: {
    reroll: (kamis: Kami[]) => Promise<boolean>;
  };
  tab: TabType;
  data: {
    accountEntity: EntityIndex;
    balance: bigint;
  };
  utils: {
    getAccountKamis: () => Kami[];
  };
}

export const Reroll = (props: Props) => {
  const { actions, data, utils, tab } = props;
  const { reroll } = actions;
  const { accountEntity, balance } = data;
  const { getAccountKamis } = utils;
  const { modals } = useVisibility();

  const [partyKamis, setPartyKamis] = useState<Kami[]>([]);
  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // ticking
  useEffect(() => {
    const refresh = () => setLastRefresh(Date.now());
    const timerId = setInterval(refresh, 1000);
    return () => clearInterval(timerId);
  }, []);

  // update the list of kamis when the account changes
  useEffect(() => {
    if (tab !== 'REROLL' || !modals.gacha) return;
    const party = getAccountKamis().filter((kami) => kami.state === 'RESTING');
    setPartyKamis(party);
  }, [accountEntity, lastRefresh]);

  // update the reroll price of each kami when the list changes
  useEffect(() => {
    let price = BigInt(0);
  }, [selectedKamis]);

  //////////////////
  // INTERACTION

  const handleReroll = () => {
    reroll(selectedKamis);
    setSelectedKamis([]);
  };

  //////////////////
  // INTERPRETATION

  const canRerollSelected = () => {
    let rerollPrice = BigInt(0);
    if (rerollPrice > balance) return false;
    return true;
  };

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];
    text.push(kami.name);
    text.push('');
    return text;
  };

  const Grid =
    partyKamis.length > 0 ? (
      <KamiGrid
        kamis={partyKamis}
        getKamiText={getKamiText}
        amtShown={partyKamis.length} // here if truncation makes sense later
        grossShowable={partyKamis.length}
        incAmtShown={() => {}}
        select={{
          arr: selectedKamis,
          set: setSelectedKamis,
        }}
      />
    ) : (
      <div
        style={{
          height: '60%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <EmptyText>No kamigotchis to re-roll!</EmptyText>
        <EmptyText>(Only happy and healthy kamis can be re-rolled)</EmptyText>
      </div>
    );

  return (
    <Container>
      {partyKamis.map((kami) => (
        <Tooltip key={kami.index} text={[]}>
          <KamiBlock kami={kami} isSelectable />
        </Tooltip>
      ))}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  overflow-y: scroll;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  width: 100%;
`;
