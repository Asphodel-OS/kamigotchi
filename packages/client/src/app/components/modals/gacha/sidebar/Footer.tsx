import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Stepper, Tooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { TabType } from '../types';

// action labels for the purchase footer
const ActionMap = new Map<TabType, string>([
  ['MINT', 'Mint'],
  ['REROLL', 'Reroll'],
  ['AUCTION', 'Bid'],
]);

interface Props {
  actions: {
    approve: (payItem: Item, price: number) => void;
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
    payItem: Item;
    saleItem: Item;
    balance: number;
  };
  state: {
    tab: TabType;
  };
}

export const Footer = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { approve, bid, mint, reroll } = actions;
  const { quantity, setQuantity, price } = controls;
  const { payItem, saleItem, balance } = data;
  const { tab } = state;

  /////////////////
  // ERC20 APPROVAL

  const { balances: tokenBal } = useTokens();
  const [needsApproval, setNeedsApproval] = useState(true);
  const [enoughBalance, setEnoughBalance] = useState(true);

  const checkNeedsApproval = () =>
    payItem.address !== undefined && (tokenBal.get(payItem.address!)?.allowance || 0) < price;
  const checkEnoughBalance = () => {
    if (payItem.address) return (tokenBal.get(payItem.address)?.balance || 0) >= price;
    else return balance >= price;
  };

  useEffect(() => {
    setNeedsApproval(checkNeedsApproval());
    setEnoughBalance(checkEnoughBalance());
  }, [tokenBal, price]);

  // const isDisabled = quantity <= 0 || price > balance;
  const isDisabled = quantity <= 0 || !enoughBalance;

  /////////////////
  // COMPONENTS

  const getButtonText = () => {
    if (tab === 'AUCTION') return needsApproval ? 'Approve' : 'Bid';
    else return ActionMap.get(tab) ?? 'Mint';
  };

  const handleSubmit = async () => {
    playClick();
    let success = false;
    if (tab === 'MINT') success = await mint(quantity);
    else if (tab === 'REROLL') success = await reroll([], BigInt(0));
    else if (tab === 'AUCTION') {
      if (needsApproval) approve(payItem, price);
      else bid(saleItem, quantity); // TODO: await on success
    }
    if (success) setQuantity(0);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, Math.min(balance, rawQuantity));
    setQuantity(quantity);
  };

  const getSubmitTooltip = () => {
    if (!enoughBalance) return ['too poore'];
    if (quantity <= 0) return ['no items to purchase'];

    let saleDesc = `Purchase ${quantity} ${saleItem.name}`;
    if (tab === 'MINT') saleDesc = `Mint ${quantity} Kami`;
    if (tab === 'REROLL') saleDesc = `Reroll ${quantity} Kami`;
    return [saleDesc, `for ${price} ${payItem.name}`];
  };

  return (
    <Container>
      <Quantity type='string' value={quantity} onChange={(e) => handleChange(e)} />
      <Stepper
        value={quantity}
        set={setQuantity}
        scale={6}
        disableInc={tab === 'REROLL' || !enoughBalance}
        disableDec={tab === 'REROLL' || quantity <= 0}
      />
      <Submit onClick={isDisabled ? undefined : handleSubmit} disabled={isDisabled}>
        <Tooltip text={getSubmitTooltip()} alignText='center' grow>
          {getButtonText()}
          {/* {ActionMap.get(tab) ?? 'Mint'} */}
        </Tooltip>
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
    disabled
      ? `
        background-color: #bbb;
        pointer-events: auto;
        cursor: default; `
      : `
        &:hover {
          background-color: #ddd;
        }
        &:active {
          background-color: #bbb;
        }`}
`;
