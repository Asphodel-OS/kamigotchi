import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { PresaleData } from 'network/chain';
import { useState } from 'react';
import { InputButton } from './InputButton';

interface Props {
  actions: {
    approve: (quantity: number) => void;
    buy: (quantity: number) => void;
  };
  data: PresaleData;
  tokenBal: {
    allowance: number;
    balance: number;
  };
}

export const Info = (props: Props) => {
  const { actions, data, tokenBal } = props;
  const { approve, buy } = actions;

  const [quantity, setQuantity] = useState(data.allo - data.bought);

  const enoughApproval = () => tokenBal.allowance >= quantity;
  const enoughCurrency = () => tokenBal.balance >= quantity;

  /////////////////
  // INTERPRETATION

  const getAction = () => {
    if (tokenBal.balance < quantity) return approve; // doesn't matter, disabled
    if (tokenBal.allowance < quantity) return approve;
    return buy;
  };

  const getButtonText = () => {
    if (tokenBal.balance < quantity) return 'Poore';
    if (tokenBal.allowance < quantity) return 'Approve';
    return 'Buy';
  };

  const isDisabled = () => {
    if (tokenBal.balance < quantity) return true;
    return false;
  };

  const getTooltip = () => {
    if (tokenBal.balance < quantity) return ['too poore'];
    if (tokenBal.allowance < quantity) return ['Approve', 'to spend', 'your ONYX'];
    return [`claim ${quantity * data.price} ONYX`, `for ${quantity} ETH`];
  };

  return (
    <Container>
      <Tooltip text={[`you have ${(data.allo - data.bought).toFixed(3)} available`]}>
        <Text>Total Allo: {data.allo.toFixed(3)}</Text>
        <Text>Total Claimed: {data.bought.toFixed(3)}</Text>
      </Tooltip>
      <InputButton
        button={{ text: 'Approve', onClick: getAction(), disabled: isDisabled(), tooltip: [] }}
        input={{ value: quantity, setValue: setQuantity, max: 0.5, min: 0, step: 0.001 }}
      />
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-radius: 0.45vw;
  padding: 1.2vw;
  width: 32vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: space-around;
`;

const Text = styled.div`
  font-size: 1.2vw;
  line-height: 1.8vw;
`;
