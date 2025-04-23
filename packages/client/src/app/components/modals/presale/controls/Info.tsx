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
    if (quantity == 0) return 'Buy';
    if (tokenBal.balance < quantity) return 'Poore';
    if (tokenBal.allowance < quantity) return 'Approve';
    return 'Buy';
  };

  const isDisabled = () => {
    return quantity == 0 || tokenBal.balance < quantity;
  };

  const getTooltip = () => {
    let tooltip: string[] = [];
    if (tokenBal.balance < quantity) {
      tooltip = [
        'too poore',
        '',
        `you need ${quantity - tokenBal.balance} more ETH to claim ${quantity * data.price}`,
      ];
    } else if (tokenBal.allowance < quantity) {
      tooltip = ['Approve', 'to spend', 'your ONYX'];
    } else {
      tooltip = ['claim ' + quantity * data.price + ' ONYX', 'for ' + quantity + ' ETH'];
    }
    return tooltip;
  };

  return (
    <Container>
      <Tooltip text={[`you have ${(data.allo - data.bought).toFixed(3)} available`]}>
        <Text>Total Allo: {data.allo.toFixed(3)}</Text>
        <Text>Total Claimed: {data.bought.toFixed(3)}</Text>
      </Tooltip>
      <InputButton
        button={{
          text: getButtonText(),
          onClick: getAction(),
          disabled: isDisabled(),
          tooltip: getTooltip(),
        }}
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
  line-height: 2.4vw;
`;
