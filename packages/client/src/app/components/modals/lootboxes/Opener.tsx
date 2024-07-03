import styled from 'styled-components';

import { ActionButton, ItemIcon, Tooltip } from 'app/components/library';
import { Inventory } from 'network/shapes/Inventory';
import { Lootbox } from 'network/shapes/Lootbox';

interface Props {
  actions: {
    open: (amount: number) => Promise<void>;
  };
  data: {
    inventory: Inventory | undefined;
    lootbox: Lootbox;
  };
}

export const Opener = (props: Props) => {
  const { data, actions } = props;

  ///////////////
  // DISPLAY

  const currBal = data.inventory?.balance || 0;

  const OpenButton = (amount: number) => {
    const enabled = amount <= currBal;
    const warnText = enabled ? '' : 'Insufficient boxes';
    return (
      <Tooltip text={[warnText]}>
        <ActionButton
          onClick={() => actions.open(amount)}
          text={`Open ${amount}`}
          size='large'
          disabled={!enabled}
        />
      </Tooltip>
    );
  };

  return (
    <Container>
      <ItemIcon item={data.lootbox} balance={currBal} size='large' />
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
