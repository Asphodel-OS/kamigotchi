import { utils } from 'ethers';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { KamiGrid } from './components/KamiGrid';

import { Kami } from 'network/shapes/Kami';
import { SideBalance } from './components/SideBalance';

interface Props {
  actions: {
    handleReroll: (kamis: Kami[], price: bigint) => () => Promise<void>;
  };
  data: {
    kamis: Kami[];
    balance: bigint;
  };
  utils: {
    getRerollCost: (kami: Kami) => bigint;
  };
}

export const Reroll = (props: Props) => {
  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [rerollPrice, setRerollPrice] = useState<bigint>(BigInt(0));

  //////////////////
  // LOGIC

  useEffect(() => {
    let price = BigInt(0);
    selectedKamis.forEach((kami) => (price += props.utils.getRerollCost(kami)));
    setRerollPrice(price);
  }, [selectedKamis]);

  const handleReroll = () => {
    props.actions.handleReroll(selectedKamis, rerollPrice)();
    setSelectedKamis([]);
  };

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];

    // traits
    text.push(kami.name);
    text.push('');

    // stats
    text.push('Re-roll cost: ' + utils.formatEther(props.utils.getRerollCost(kami)) + 'Ξ');
    text.push('Re-rolls done: ' + kami.rerolls.toString());

    return text;
  };

  const formatWei = (wei: bigint): string => {
    return Number(utils.formatEther(wei)).toFixed(4);
  };

  const FooterButton = (
    <Footer>
      <SideBalance balance={formatWei(rerollPrice) + 'Ξ'} title='Re-roll cost' />
      <div style={{ flexGrow: 6 }} />
      <ActionButton
        onClick={handleReroll}
        text='Re-roll'
        size='large'
        disabled={selectedKamis.length === 0 || rerollPrice > props.data.balance}
        fill
      />
    </Footer>
  );

  const Grid =
    props.data.kamis.length > 0 ? (
      <KamiGrid
        kamis={props.data.kamis}
        getKamiText={getKamiText}
        amtShown={props.data.kamis.length} // here if truncation makes sense later
        grossShowable={props.data.kamis.length}
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
