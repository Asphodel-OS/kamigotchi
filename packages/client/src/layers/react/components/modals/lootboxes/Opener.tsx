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
          text={`Open ${amount}`}
          size='large'
          disabled={!enabled}
        />
      </Tooltip>
    );
  }

  return (
    <Container>
      <ItemBox>
        <Image src={props.inventory?.item.image.x4} />
        <ItemBalance>{props.inventory?.balance}</ItemBalance>
      </ItemBox>
      <ButtonBox>
        {OpenButton(1)}
        {OpenButton(10)}
      </ButtonBox>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  height: 90%;
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
  padding: 1vw;
`;

const ItemBox = styled.div`
  position: relative;
  border: solid black .2vw;
  border-radius: 1vw;

  width: 10vw;
  height: 10vw;
  margin: 1.4vw;

  align-items: center;
  justify-content: center;
`;

const ItemBalance = styled.div` 
  border-top: solid black .2vw;
  border-left: solid black .2vw;
  border-radius: 0.5vw 0 0 0;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: .4vh .4vw;

  font-family: Pixel;
  font-size: 1vw;
`;

const ButtonBox = styled.div`  
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 75%;
  padding: 1vw;
`;
