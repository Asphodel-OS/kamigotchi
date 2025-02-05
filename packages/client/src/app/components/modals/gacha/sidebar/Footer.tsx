import { useState } from 'react';
import styled from 'styled-components';

import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { AuctionMode, TabType } from '../types';

// action labels for the purchase footer
const ActionMap = new Map<TabType, string>([
  ['MINT', 'Mint'],
  ['REROLL', 'Reroll'],
  ['AUCTION', 'Bid'],
]);

interface Props {
  actions: {
    bid: (item: Item, amt: number) => void;
    mint: (amount: number) => Promise<boolean>;
    reroll: (kamis: Kami[], price: bigint) => Promise<boolean>;
  };
  controls: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
  };
  data: {
    item: Item;
    balance: number;
  };
  state: {
    tick: number;
    tab: TabType;
    mode: AuctionMode;
  };
}

export const Footer = (props: Props) => {
  const { actions, data, state } = props;
  const { bid, mint, reroll } = actions;
  const { item, balance } = data;
  const { mode, tab, tick } = state;

  const [quantity, setQuantity] = useState(0);

  const handleInc = () => {
    playClick();
    setQuantity(Math.min(balance, quantity + 1));
  };

  const handleDec = () => {
    playClick();
    setQuantity(Math.max(0, quantity - 1));
  };

  const handSubmit = async () => {
    playClick();
    let success = false;
    if (tab === 'MINT') success = await mint(quantity);
    else if (tab === 'REROLL') success = await reroll([], BigInt(0));
    else if (tab === 'AUCTION') bid(item, quantity); // TODO: await on success
    if (success) setQuantity(0);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, Math.min(balance, rawQuantity));
    setQuantity(quantity);
  };

  return (
    <Container>
      <Quantity type='string' value={quantity} onChange={(e) => handleChange(e)} />
      <Stepper>
        <StepperButton onClick={handleInc} disabled={tab === 'REROLL' || quantity >= balance}>
          +
        </StepperButton>
        <StepperButton onClick={handleDec} disabled={tab === 'REROLL' || quantity <= 0}>
          -
        </StepperButton>
      </Stepper>
      <Submit onClick={handSubmit} disabled={quantity <= 0}>
        {ActionMap.get(tab) ?? 'Mint'}
      </Submit>
    </Container>
  );
};

const Container = styled.div`
  background-color: #fff;
  position: relative;
  border-radius: 0 0 1.2vw 0;
  border-top: 0.15vw solid black;
  width: 100%;
  height: 4.5vw;

  display: flex;
  flex-direction: row nowrap;
  align-items: center;
`;

const Quantity = styled.input`
  border: none;
  background-color: #eee;
  border-right: 0.15vw solid black;
  width: 6vw;
  height: 100%;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;

  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
  text-align: center;
`;

const Stepper = styled.div`
  border-right: 0.15vw solid black;
  background-color: black;
  gap: 0.12vw;
  height: 100%;
  width: 6vw;
  display: flex;
  flex-flow: column nowrap;
`;

const StepperButton = styled.div<{ disabled?: boolean }>`
  background-color: #fff;
  height: 100%;
  width: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  font-size: 1.2vw;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
  ${({ disabled }) =>
    disabled &&
    `
  background-color: #bbb; 
  cursor: default; 
  pointer-events: none;`}
`;

const Submit = styled.div<{ disabled?: boolean }>`
  border-radius: 0 0 1.2vw 0;
  width: 100%;
  height: 100%;
  text-align: center;
  line-height: 100%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  font-size: 1.5vw;

  cursor: pointer;
  user-select: none;

  ${({ disabled }) =>
    disabled &&
    `
  background-color: #bbb; 
  cursor: default; 
  pointer-events: none;`}

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
