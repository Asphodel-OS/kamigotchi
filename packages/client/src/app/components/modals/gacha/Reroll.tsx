import { utils } from 'ethers';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'app/components/library';
import { BalanceBar } from './components/BalanceBar';
import { KamiGrid } from './components/KamiGrid';

import { ethereumLogo } from 'assets/images/logos';
import { Kami } from 'network/shapes/Kami';

interface Props {
  actions: {
    handleReroll: (kamis: Kami[], price: bigint) => () => Promise<void>;
  };
  data: {
    kamis: Kami[];
    balance: bigint;
  };
  display: {
    Tab: JSX.Element;
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
      <div style={{ width: '73%' }}></div>
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
      <BalanceBar
        balance={formatWei(props.data.balance)}
        price={formatWei(rerollPrice)}
        name='Total re-roll price'
        icon={ethereumLogo}
      />
      <InnerBox>
        {props.display.Tab}
        <AmountText>Kamigotchis re-rollable: {props.data.kamis.length}</AmountText>
        {Grid}
      </InnerBox>
      {FooterButton}
    </OuterBox>
  );
};

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  width: 100%;
  padding: 0.2vh 1vw 1.2vh;
`;

const InnerBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;

  flex: 1;
  border: solid 0.15vw black;
  border-radius: 0.75vw;
  height: 60%;
  padding: 1vw;
  margin: 1vw;

  gap: 1.2vw;
`;

const OuterBox = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
`;

const AmountText = styled.p`
  font-family: Pixel;
  font-size: 1.6vw;
  text-align: start;
  color: #444;
`;

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  width: 100%;
`;
