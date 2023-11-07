import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Lootbox } from "layers/react/shapes/Lootbox";

interface Props {
  account: Account;
  actions: {
    openTx: (index: number, amount: number) => Promise<void>;
    revealTx: (id: EntityID) => Promise<void>;
    setState: (state: string) => void;
  };
  inventory: Inventory | undefined;
  utils: {
    getLootbox: (index: number) => Lootbox;
  }
}

export const Opener = (props: Props) => {
  const [state, setState] = useState("START");
  const [curBal, setCurBal] = useState(0);
  const [triedReveal, setTriedReveal] = useState(false);
  const [waitingToReveal, setWaitingToReveal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Lootbox>();

  // AUTO REVEAL
  // TODO: convert to manual reveal - triggered in main modal, triggered by state
  useEffect(() => {
    const tx = async () => {
      if (!triedReveal) {
        setTriedReveal(true);
        // wait to give buffer for OP rpc
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const raw = [...props.account.lootboxLogs?.unrevealed!];
        const reversed = raw.reverse();
        reversed.forEach(async (LootboxLog) => {
          try {
            await props.actions.revealTx(LootboxLog.id);
            props.actions.setState("REWARDS");
          }
          catch (e) { console.log(e); }
        });
        if (waitingToReveal) {
          setWaitingToReveal(false);
        }
      }
    }
    tx();

  }, [props.account.lootboxLogs?.unrevealed]);

  useEffect(() => {
    setSelectedBox(
      props.utils.getLootbox(props.inventory?.item.index || 0)
    );
    setCurBal(props.inventory?.balance || 0);
  }, [props.inventory ? props.inventory.item : 0]);

  const startReveal = async (amount: number) => {
    setWaitingToReveal(true);
    setTriedReveal(false);
    setState("REVEALING");
    await props.actions.openTx(selectedBox?.index!, amount);
    return;
  }

  ///////////////
  // DISPLAY

  const OpenButton = (amount: number) => {
    if (waitingToReveal) {
      return (<div></div>)
    } else {
      const enabled = (amount <= (curBal));
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
      default:
        return StartScreen;
    }
  }

  const StartScreen = (
    <Grid>
      <div style={{ gridRow: 1 }}>
        <Image src='https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif' />
      </div>
      <ProductBox style={{ gridRow: 2 }}>
        {OpenButton(1)}
        {OpenButton(10)}
      </ProductBox>
      <SubText style={{ gridRow: 3 }}>
        You have: {curBal} {selectedBox?.name}es
      </SubText>
    </Grid>
  );

  const RevealScreen = (
    <SubText>
      Revealing... please don't leave this page!
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

const Image = styled.img`
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

const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;
