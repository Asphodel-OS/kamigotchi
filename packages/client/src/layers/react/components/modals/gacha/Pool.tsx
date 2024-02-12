import styled from 'styled-components';
import React, { useEffect, useState } from 'react';

import { ActionButton } from 'layers/react/components/library';
import { InputSingleNumberForm } from 'layers/react/components/library';
import { BalanceBar } from './components/BalanceBar';
import { KamiGrid } from './components/KamiGrid';

import { playClick } from 'utils/sounds';
import musuIcon from 'assets/images/icons/musu.png';
import { Kami, QueryOptions, Options } from 'layers/network/shapes/Kami';

interface Props {
  actions: {
    handleMint: (amt: number) => () => Promise<void>;
  };
  data: {
    account: {
      balance: number;
    };
  };
  display: {
    Tab: JSX.Element;
  };
  query: {
    getLazyKamis: (
      queryOpts: QueryOptions,
      options?: Options
    ) => Array<() => Kami>;
  };
}

export const Pool = (props: Props) => {
  const [mintAmt, setMintAmt] = useState<number>(0);
  const [numShown, setNumShown] = useState<number>(49);

  const mintPrice = 1;

  //////////////////
  // LOGIC

  const getKamiText = (kami: Kami): string[] => {
    const traitString =
      (kami.traits?.body.name || '') +
      ' | ' +
      (kami.traits?.hand.name || '') +
      ' | ' +
      (kami.traits?.face.name || '') +
      ' | ' +
      (kami.traits?.color.name || '') +
      ' | ' +
      (kami.traits?.background.name || '');

    return [
      traitString,
      '',
      `Health: ${kami.stats.health}`,
      `Power: ${kami.stats.power}`,
      `Violence: ${kami.stats.violence}`,
      `Harmony: ${kami.stats.harmony}`,
      `Slots: ${kami.stats.slots}`,
    ];
  };

  const lazyKamis = props.query.getLazyKamis(
    { state: 'GACHA' },
    { traits: true }
  );

  const getTruncatedKamis = () => {
    const amt = numShown < lazyKamis.length ? numShown : lazyKamis.length;
    const shortLazies = [...lazyKamis].splice(0, amt);

    return shortLazies.map((lazyKami) => lazyKami());
  };

  ///////////////////
  // DISPLAY

  const FooterButton = (
    <Footer>
      <div style={{ width: '60%' }}></div>
      <InputSingleNumberForm
        id='mint-stepper'
        bounds={{ min: 0, max: props.data.account.balance, step: 1 }}
        watch={setMintAmt}
        stepper
      />
      <ActionButton
        id='mint-button'
        onClick={props.actions.handleMint(mintAmt)}
        text='Mint'
        size='large'
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
        name='Mint price'
        icon={musuIcon}
      />
      <InnerBox>
        {props.display.Tab}
        <AmountText>Kamigotchis in pool: {lazyKamis.length}</AmountText>
        <KamiGrid
          kamis={getTruncatedKamis()}
          amtShown={numShown}
          grossShowable={lazyKamis.length}
          incAmtShown={() => setNumShown(numShown + 25)}
          getKamiText={getKamiText}
        />
      </InnerBox>
      {FooterButton}
    </OuterBox>
  );
};

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
