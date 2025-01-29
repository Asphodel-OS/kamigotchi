import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { EntityIndex } from '@mud-classic/recs';
import { ActionButton } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { TabType } from '../types';
import { KamiGrid } from './KamiGrid';
import { SideBalance } from './SideBalance';

interface Props {
  actions: {
    reroll: (kamis: Kami[], price: bigint) => Promise<boolean>;
  };
  tab: TabType;
  data: {
    accountEntity: EntityIndex;
    balance: bigint;
    maxRerolls: number;
  };
  utils: {
    getRerollCost: (kami: Kami) => bigint;
    getAccountKamis: () => Kami[];
  };
}

export const Reroll = (props: Props) => {
  const { actions, data, utils, tab } = props;
  const { reroll } = actions;
  const { accountEntity, maxRerolls, balance } = data;
  const { getAccountKamis, getRerollCost } = utils;
  const { modals } = useVisibility();

  const [partyKamis, setPartyKamis] = useState<Kami[]>([]);
  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [rerollPrice, setRerollPrice] = useState<bigint>(BigInt(0));
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
    selectedKamis.forEach((kami) => (price += getRerollCost(kami)));
    setRerollPrice(price);
  }, [selectedKamis]);

  //////////////////
  // INTERACTION

  const handleReroll = () => {
    reroll(selectedKamis, rerollPrice);
    setSelectedKamis([]);
  };

  //////////////////
  // INTERPRETATION

  const canRerollSelected = () => {
    let rerollPrice = BigInt(0);
    for (const kami of selectedKamis) {
      if (kami.rerolls ?? 0 >= maxRerolls) return false;
      rerollPrice += getRerollCost(kami);
    }
    if (rerollPrice > balance) return false;
    return true;
  };

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];
    text.push(kami.name);
    text.push('');
    text.push(`Re-roll cost: ${props.utils.getRerollCost(kami)} Ξ`);
    text.push(`Re-rolls done: ${kami.rerolls?.toString()} / ${maxRerolls}`);
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
    <OuterBox>
      {Grid}
      <Footer>
        <SideBalance balance={maxRerolls.toString()} title='Re-roll cost' />
        <div style={{ flexGrow: 6 }} />
        <ActionButton
          onClick={handleReroll}
          text='Re-roll'
          size='large'
          disabled={selectedKamis.length === 0 || canRerollSelected()}
          fill
        />
      </Footer>
    </OuterBox>
  );
};

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  padding: 0.5vh 2vw 1vh;
`;

const OuterBox = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 50vh;
  flex-grow: 1;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  width: 100%;
`;
