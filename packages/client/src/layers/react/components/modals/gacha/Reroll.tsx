import styled from 'styled-components';
import React, { useEffect, useState } from 'react';
import { utils } from 'ethers';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { BalanceBar } from './BalanceBar';
import { KamiGrid } from './KamiGrid';

import { playClick } from 'utils/sounds';
import musuIcon from "assets/images/icons/musu.png";
import { Kami } from 'layers/network/shapes/Kami';


interface Props {
  actions: {
    handleReroll: (kamis: Kami[]) => () => Promise<void>;
  }
  data: {
    kamis: Kami[];
    balance: number;
  }
  display: {
    Tab: JSX.Element;
  }
  utils: {
    getRerollCost: (kami: Kami) => number;
  }
}

export const Reroll = (props: Props) => {

  const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
  const [rerollPrice, setRerollPrice] = useState<number>(0);

  //////////////////
  // LOGIC

  useEffect(() => {
    let price = 0;
    selectedKamis.forEach(kami => price += props.utils.getRerollCost(kami));
    setRerollPrice(price);
  }, [selectedKamis]);

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
  }

  const FooterButton = (
    <Footer>
      <div style={{ width: '73%' }}></div>
      <ActionButton
        id="mint-button"
        onClick={props.actions.handleReroll(selectedKamis)}
        text='Re-roll'
        size="large"
        disabled={selectedKamis.length === 0}
        fill
      />
    </Footer>
  );

  return (
    <OuterBox>
      <BalanceBar
        balance={props.data.balance.toFixed(2)}
        price={rerollPrice.toString()}
        name="Total re-roll price"
        icon={musuIcon}
      />
      <InnerBox>
        {props.display.Tab}
        <AmountText>Kamigochis re-rollable: {props.data.kamis.length}</AmountText>
        <KamiGrid
          kamis={props.data.kamis}
          kamiText={getKamiText}
          select={{
            arr: selectedKamis,
            set: setSelectedKamis
          }}
        />
      </InnerBox>
      {FooterButton}
    </OuterBox>
  );
}

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
  border: solid .15vw black;
  border-radius: .75vw;
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