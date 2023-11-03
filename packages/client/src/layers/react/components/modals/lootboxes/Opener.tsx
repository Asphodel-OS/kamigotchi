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
  inventory: Inventory | undefined;
  lootbox: Lootbox;
  utils: {
    setState: (state: string) => void;
    setAmount: (amount: number) => void;
  }
}

export const Opener = (props: Props) => {

  const [curBal, setCurBal] = useState(0);

  useEffect(() => {
    setCurBal(props.inventory?.balance || 0);
  }, [props.inventory ? props.inventory.item : 0]);

  const startReveal = async (amount: number) => {
    props.utils.setAmount(amount);
    props.utils.setState("REVEALING");
    return;
  }

  ///////////////
  // DISPLAY

  const OpenButton = (amount: number) => {
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

  return (
    <Grid>
      <div style={{ gridRow: 1 }}>
        <Image src={props.inventory?.item.uri} />
      </div>
      <ProductBox style={{ gridRow: 2 }}>
        {OpenButton(1)}
        {OpenButton(10)}
      </ProductBox>
      <SubText style={{ gridRow: 3 }}>
        You have: {curBal} box{curBal != 1 ? 'es' : ''}
      </SubText>
    </Grid>
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
