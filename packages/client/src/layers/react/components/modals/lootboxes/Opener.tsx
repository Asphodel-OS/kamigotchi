import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Lootbox, LootboxLog } from "layers/react/shapes/Lootbox";

interface Props {
  account: Account;
  actions: {
    openTx: (index: number, amount: number) => Promise<void>;
    revealTx: (id: EntityID) => Promise<void>;
  };
  lootbox: Lootbox;
  inventory: Inventory;
}

export const Opener = (props: Props) => {
  const [state, setState] = useState("START");
  const [triedReveal, setTriedReveal] = useState(false);
  const [waitingToReveal, setWaitingToReveal] = useState(false);

  // AUTO REVEAL
  useEffect(() => {
    const tx = async () => {
      if (!triedReveal) {
        setTriedReveal(true);
        // wait to give buffer for OP rpc
        await new Promise((resolve) => setTimeout(resolve, 3000));
        props.account.lootboxLogs?.unrevealed.forEach(async (LootboxLog) => {
          try { await props.actions.revealTx(LootboxLog.id); }
          catch (e) { console.log(e); }
        });
        if (waitingToReveal) {
          setWaitingToReveal(false);
          setState("END");
        }
      }
    }
    tx();

  }, [props.account.lootboxLogs?.unrevealed]);

  const startReveal = async (amount: number) => {
    setWaitingToReveal(true);
    setTriedReveal(false);
    setState("REVEALING");
    await props.actions.openTx(props.lootbox.index, amount);
    return;
  }

  ///////////////
  // DISPLAY

  const OpenButton = (amount: number) => {
    if (waitingToReveal) {
      return (<div></div>)
    } else {
      const enabled = (amount <= (props.inventory.balance ? props.inventory.balance : 0));
      const warnText = enabled ? '' : 'Insufficient boxes';
      return (
        <Tooltip text={[warnText]}>
          <ActionButton
            id='button-open'
            onClick={() => startReveal(amount)}
            size='vending'
            text={`Open ${amount} box${amount > 1 ? 'es' : ''}`}
            inverted disabled={!enabled}
          />
        </Tooltip>
      );
    }
  }

  const ScreenSelector = () => {
    switch (state) {
      case "START":
        return StartScreen;
        break;
      case "REVEALING":
        return RevealScreen;
        break;
      case "END":
        return EndScreen;
        break;
      default:
        return StartScreen;
    }
  }

  const StartScreen = (
    <Grid>
      <div style={{ gridRow: 1 }}>
        <KamiImage src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
      </div>
      <ProductBox style={{ gridRow: 2 }}>
        {OpenButton(1)}
        {OpenButton(10)}
      </ProductBox>
      <SubText style={{ gridRow: 3 }}>
        You have: {(props.inventory.balance ? props.inventory.balance : 0)} {props.lootbox.name}es
      </SubText>
    </Grid>
  );

  const RevealScreen = (
    <SubText>
      Revealing... please don't leave this page!
    </SubText>
  );

  const EndScreen = (
    <SubText>
      Revealed!
    </SubText>
  );

  return (
    <div>
      {ScreenSelector()}
    </div>
  );
}

const Grid = styled.div`
  display: grid;
  grid-row-gap: 6px;
  grid-column-gap: 12px;
  justify-items: center;
  justify-content: center;

  padding: 24px 6px;
  margin: 0px 6px;
`;

const Input = styled.input`
  width: 50%;

  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  justify-content: center;
  font-family: Pixel;

  border-width: 0px;
  padding: 6px;

  &:focus {
    outline: none;
  }

  ::-webkit-inner-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }
  ::-webkit-outer-spin-button{
    -webkit-appearance: none; 
    margin: 0; 
  }  
`;

const KamiImage = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  height: 90px;
  margin: 0px;
  padding: 0px;
`;

const ProductBox = styled.div`
  border-color: black;
  border-radius: 2px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 5px;
  max-width: 75%;
`;

const SubHeader = styled.p`
  color: #333;

  padding: 1.5vw;
  font-family: Pixel;
  font-size: 1.5vw;
  text-align: center;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;

const QuantityStepper = styled.button`
  font-size: 16px;
  color: #777;
  text-align: center;
  font-family: Pixel;

  border-style: none;
  background-color: transparent;

  &:hover {
    color: #000;  
  }
`;
