import styled from "styled-components";
import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Lootbox } from "layers/react/shapes/Lootbox";
import { ItemIcon } from "layers/react/components/library/ItemIcon";

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
      <ItemIcon
        id={props.lootbox.index.toString()}
        item={props.lootbox}
        balance={curBal}
        size='large'
      />
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

const ButtonBox = styled.div`  
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  width: 75%;
  padding: 1vw;
`;
