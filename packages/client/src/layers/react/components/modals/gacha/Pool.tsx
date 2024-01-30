import styled from 'styled-components';
import React, { useEffect, useState } from 'react';

import { ActionButton } from 'layers/react/components/library';
import { InputSingleNumberForm } from 'layers/react/components/library';
import { BalanceBar } from './BalanceBar';
import { KamiGrid } from './KamiGrid';

import { playClick } from 'utils/sounds';
import musuIcon from "assets/images/icons/musu.png";
import { Kami } from 'layers/network/shapes/Kami';


interface Props {
  actions: {
    handleMint: (amt: number) => () => Promise<void>;
  }
  data: {
    account: {
      balance: number;
    }
    pool: {
      kamis: Kami[];
    }
  }
  display: {
    Tab: JSX.Element;
  }

}

export const Pool = (props: Props) => {

  const [mintAmt, setMintAmt] = useState<number>(0);

  const mintPrice = 1;

  //////////////////
  // DISPLAY

  const getKamiText = (kami: Kami): string[] => {
    const text = [];

    // traits
    text.push(
      (kami.traits?.body.name || '') + ' | ' +
      (kami.traits?.hand.name || '') + ' | ' +
      (kami.traits?.face.name || '') + ' | ' +
      (kami.traits?.color.name || '') + ' | ' +
      (kami.traits?.background.name || '')
    );
    text.push('');

    // stats
    text.push(`Health: ${kami.stats.health}`);
    text.push(`Power: ${kami.stats.power}`);
    text.push(`Violence: ${kami.stats.violence}`);
    text.push(`Harmony: ${kami.stats.harmony}`);

    return text;
  }

  const FooterButton = (
    <Footer>
      <div style={{ width: '60%' }}></div>
      <InputSingleNumberForm
        id="mint-stepper"
        bounds={{ min: 0, max: props.data.account.balance, step: 1 }}
        watch={setMintAmt}
        stepper
      />
      <ActionButton
        id="mint-button"
        onClick={props.actions.handleMint(mintAmt)}
        text='Mint'
        size="large"
        disabled={mintAmt === 0 || mintAmt > props.data.account.balance}
        fill
      />
    </Footer>
  );

  return (
    <OuterBox>
      <BalanceBar
        balance={props.data.account.balance.toFixed(2)}
        price={mintPrice.toFixed(2)}
        name="Mint price"
        icon={musuIcon}
      />
      <InnerBox>
        {props.display.Tab}
        <AmountText>Kamigotchis in pool: {props.data.pool.kamis.length}</AmountText>
        <KamiGrid
          kamis={props.data.pool.kamis}
          getKamiText={getKamiText}
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
  align-items: center;

  width: 100%;
  padding: 0vh 1vw 1vh;
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