import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';
import { KamiGrid } from '../components/KamiGrid';
import { SideBalance } from './SideBalance';

interface Props {
  actions: {
    handleReroll: (kamis: Kami[], price: bigint) => () => Promise<void>;
  };
  data: {
    kamis: Kami[];
    balance: bigint;
    maxRerolls: number;
  };
  utils: {
    getRerollCost: (kami: Kami) => bigint;
  };
}

export const Reroll = (props: Props) => {
  const { actions, data, utils } = props;
  const { kamis, maxRerolls } = data;

  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [rerollPrice, setRerollPrice] = useState<bigint>(BigInt(0));

  //////////////////
  // LOGIC

  // update the reroll price of each kami when the list changes
  useEffect(() => {
    let price = BigInt(0);
    selectedKamis.forEach((kami) => (price += utils.getRerollCost(kami)));
    setRerollPrice(price);
  }, [selectedKamis]);

  //
  const handleReroll = () => {
    actions.handleReroll(selectedKamis, rerollPrice)();
    setSelectedKamis([]);
  };

  const canRerollSelected = () => {
    for (const kami of selectedKamis) {
      if (kami.rerolls ?? 0 > maxRerolls) return false;
    }
    return true;
  };

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];

    // traits
    text.push(kami.name);
    text.push('');

    // stats
    text.push(`Re-roll cost: ${props.utils.getRerollCost(kami)} Ξ`);
    text.push(`Re-rolls done: ${kami.rerolls?.toString()} / ${maxRerolls}`);

    return text;
  };

  const formatWei = (wei: bigint): string => {
    // return Number(utils.formatEther(wei)).toFixed(4);
    return Number(wei).toFixed(2);
  };

  const FooterButton = (
    <Footer>
      {/* <SideBalance balance={formatWei(rerollPrice) + 'Ξ'} title='Re-roll cost' /> */}
      <SideBalance balance={maxRerolls.toString()} title='Re-roll cost' />
      <div style={{ flexGrow: 6 }} />
      <ActionButton
        onClick={handleReroll}
        text='Re-roll'
        size='large'
        // disabled={selectedKamis.length === 0 || rerollPrice > props.data.balance}
        disabled={selectedKamis.length === 0 || canRerollSelected()}
        fill
      />
    </Footer>
  );

  const Grid =
    props.data.kamis.length > 0 ? (
      <KamiGrid
        kamis={kamis}
        getKamiText={getKamiText}
        amtShown={kamis.length} // here if truncation makes sense later
        grossShowable={kamis.length}
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
      {FooterButton}
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
