import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { PresaleData } from 'network/chain';
import { useState } from 'react';
import { InputButton } from './InputButton';

export const Info = ({
  actions,
  data,
  tokenBal,
  time,
}: {
  actions: {
    approve: (quantity: number) => void;
    buy: (quantity: number) => void;
  };
  data: PresaleData;
  tokenBal: {
    allowance: number;
    balance: number;
  };
  time: {
    now: number;
    start: number;
    end: number;
  };
}) => {
  const { approve, buy } = actions;

  const [quantity, setQuantity] = useState(0);

  /////////////////
  // INTERPRETATION

  const getButtonAction = () => {
    if (tokenBal.balance < quantity) return approve; // doesn't matter, disabled
    if (tokenBal.allowance < quantity) return approve;
    return buy;
  };

  // get the subtext above the button
  const getButtonSubtext = () => {
    return `${(quantity / data.price).toLocaleString()} $ONYX`;
  };

  const getButtonText = () => {
    if (quantity == 0) return 'Claim';
    if (tokenBal.balance < quantity) return 'Poore';
    if (tokenBal.allowance < quantity) return 'Approve';
    return 'Claim';
  };

  const getButtonTooltip = () => {
    let tooltip: string[] = [];
    if (time.now < time.start) {
      tooltip = ['Mint has not yet started'];
    } else if (time.now > time.end) {
      tooltip = ['Mint is over'];
    } else if (quantity == 0) {
      tooltip = ['Sidelined?'];
    } else if (tokenBal.balance < quantity) {
      tooltip = ['too poore', `you have ${tokenBal.balance.toFixed(3)} $ETH`];
    } else if (tokenBal.allowance < quantity) {
      tooltip = ['Approve you $ETH', 'to claim your $ONYX'];
    } else {
      tooltip = [`purchase ${quantity / data.price} $ONYX`, `for ${quantity} $ETH`];
    }
    return tooltip;
  };

  const isButtonDisabled = () => {
    if (quantity == 0) return true;
    if (tokenBal.balance < quantity) return true;
    if (time.now < time.start) return true;
    if (time.now > time.end) return true;
    return false;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <TextSection>
        <Text size={1.5}>Your Allocation</Text>
        <TextTooltip
          text={[
            `Total: ${data.allo.toFixed(3)}ETH`,
            `Claimed: ${data.bought.toFixed(3)}ETH`,
            `Claimable: ${(data.allo - data.bought).toFixed(3)}ETH`,
          ]}
          grow
        >
          <Text size={0.9} shift={0.6}>
            Total: {(data.allo / data.price).toLocaleString()}
          </Text>
          <Text size={0.9} shift={0.6}>
            Claimed: {(data.bought / data.price).toLocaleString()}
          </Text>
          <Text size={0.9} shift={0.6}>
            Claimable: {((data.allo - data.bought) / data.price).toLocaleString()}
          </Text>
        </TextTooltip>
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
          input={{
            value: quantity,
            setValue: setQuantity,
            max: data.allo - data.bought,
            min: 0,
            step: 0.01,
          }}
          balance={tokenBal.balance}
        />
      </ButtonSection>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  padding: 1.2em;
  width: 32em;
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
  color: #d0fe41;
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 2.1}em;
  padding-left: ${({ shift }) => shift ?? 0}em;
`;

const ButtonSection = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
  justify-content: flex-end;
`;
