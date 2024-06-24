import { useState } from 'react';
import styled from 'styled-components';

import { ActionButton, InputSingleNumberForm } from 'app/components/library';
import { KamiGrid } from './components/KamiGrid';

import { Kami } from 'network/shapes/Kami';
import { GachaTicket } from 'network/shapes/utils/EntityTypes';
import { SideBalance } from './components/SideBalance';

interface Props {
  actions: {
    handleMint: (amt: number) => () => Promise<void>;
  };
  data: {
    account: {
      balance: number;
    };
    lazyKamis: Array<() => Kami>;
  };
}

export const Pool = (props: Props) => {
  const [mintAmt, setMintAmt] = useState<number>(0);
  const [numShown, setNumShown] = useState<number>(49);

  const {
    account: { balance: accBal },
    lazyKamis,
  } = props.data;

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

  const FooterButton = (
    <Footer>
      <SideBalance
        balance={accBal.toFixed(1)}
        title='Balance'
        icon={GachaTicket.image}
        onClick={() => setMintAmt(accBal)}
      />
      <div style={{ flexGrow: 6 }} />
      <InputSingleNumberForm
        id='mint-stepper'
        bounds={{ min: 0, max: accBal, step: 1 }}
        watch={{ value: mintAmt, set: setMintAmt }}
        stepper
      />
      <ActionButton
        onClick={props.actions.handleMint(mintAmt)}
        text='Mint'
        size='large'
        disabled={mintAmt === 0 || mintAmt > accBal}
        fill
      />
    </Footer>
  );

  return (
    <OuterBox>
      <KamiGrid
        kamis={getTruncatedKamis()}
        amtShown={numShown}
        grossShowable={lazyKamis.length}
        incAmtShown={() => setNumShown(numShown + 25)}
        getKamiText={getKamiText}
      />
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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0.25vh;
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
