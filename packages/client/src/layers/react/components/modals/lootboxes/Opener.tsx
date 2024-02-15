import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Inventory } from 'layers/network/shapes/Inventory';
import { Lootbox } from 'layers/network/shapes/Lootbox';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ItemIcon } from 'layers/react/components/library/ItemIcon';
import { Tooltip } from 'layers/react/components/library/Tooltip';

interface Props {
  inventory: Inventory | undefined;
  lootbox: Lootbox;
  utils: {
    setState: (state: string) => void;
    setAmount: (amount: number) => void;
  };
}

export const Opener = (props: Props) => {
  const { inventory, lootbox, utils } = props;
  const [curBal, setCurBal] = useState(0);

  useEffect(() => {
    setCurBal(inventory?.balance || 0);
  }, [inventory ? inventory.item : 0]);

  const startReveal = async (amount: number) => {
    utils.setAmount(amount);
    utils.setState('REVEALING');
    return;
  };

  ///////////////
  // DISPLAY

  const OpenButton = (amount: number) => {
    const enabled = amount <= curBal;
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
  };

  return (
    <Container>
      <ItemIcon id={(lootbox.index || 1).toString()} item={lootbox} balance={curBal} size='large' />
      <ButtonBox>
        {OpenButton(1)}
        {OpenButton(10)}
      </ButtonBox>
    </Container>
  );
};

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
