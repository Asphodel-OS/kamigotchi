import styled from 'styled-components';

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

  /////////////////
  // INTERPRETATION

  const getButtonAction = () => {
    if (tokenBal.balance < quantity) return approve; // doesn't matter, disabled
    if (tokenBal.allowance < quantity) return approve;
    return buy;
  };

  // get the subtext above the button
  const getButtonSubtext = () => {
    return `${(data.price * quantity).toLocaleString()} $ONYX`;
  };

  const getButtonText = () => {
    if (quantity == 0) return 'Buy';
    if (tokenBal.balance < quantity) return 'Poore';
    if (tokenBal.allowance < quantity) return 'Approve';
    return 'Buy';
  };

  const getButtonTooltip = () => {
    let tooltip: string[] = [];
    if (quantity == 0) {
      tooltip = ['Sidelined?'];
    } else if (tokenBal.balance < quantity) {
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

  const isButtonDisabled = () => {
    return quantity == 0 || tokenBal.balance < quantity;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <TextSection>
        <Text size={1.5}>Your Allocation</Text>
        <Text size={0.9} shift={0.45}>
          Total: {(data.allo * data.price).toLocaleString()}
        </Text>
        <Text size={0.9} shift={0.45}>
          Claimed: {(data.bought * data.price).toLocaleString()}
        </Text>
        <Text size={0.9} shift={0.45}>
          Claimable: {((data.allo - data.bought) * data.price).toLocaleString()}
        </Text>
      </TextSection>
      <ButtonSection>
        <InputButton
          button={{
            text: getButtonText(),
            subtext: getButtonSubtext(),
            tooltip: getButtonTooltip(),
            onClick: getButtonAction(),
            disabled: isButtonDisabled(),
          }}
          input={{ value: quantity, setValue: setQuantity, max: 0.5, min: 0, step: 0.001 }}
        />
      </ButtonSection>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  padding: 1.2vw;
  width: 32vw;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-between;
`;

const TextSection = styled.div`
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-around;
`;

const Text = styled.div<{ size: number; shift?: number }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 2.1}vw;
  padding-left: ${(props) => props.shift ?? 0}vw;
`;

const ButtonSection = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: flex-end;
`;
