import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Stepper, Tooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { TabType, ViewMode } from '../types';

interface Props {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
    mint: (amount: number) => Promise<boolean>;
    reroll: (kamis: Kami[]) => Promise<boolean>;
  };
  controls: {
    tab: TabType;
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
  };
  data: {
    payItem: Item;
    saleItem: Item;
    balance: number;
  };
  state: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (kamis: Kami[]) => void;
  };
}

export const Footer = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { approve, bid, mint, reroll } = actions;
  const { mode, setMode, tab } = controls;
  const { payItem, saleItem, balance } = data;
  const { quantity, setQuantity, price, selectedKamis, setSelectedKamis } = state;

  /////////////////
  // ERC20 APPROVAL

  const { balances: tokenBal } = useTokens();
  const [needsApproval, setNeedsApproval] = useState(true);
  const [enoughBalance, setEnoughBalance] = useState(true);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const needsApproval = checkNeedsApproval();
    const enoughBalance = checkEnoughBalance();
    setNeedsApproval(needsApproval);
    setEnoughBalance(enoughBalance);
    setIsDisabled(quantity <= 0 || !enoughBalance);
  }, [tokenBal, price]);

  // check if a user needs further spend approval for a token
  const checkNeedsApproval = () => {
    if (!payItem.address) return false;
    const allowance = tokenBal.get(payItem.address!)?.allowance || 0;
    return allowance < price;
  };

  // check if a user has enough balance of a token to purchase
  const checkEnoughBalance = () => {
    if (payItem.address) {
      const tokenBalance = tokenBal.get(payItem.address)?.balance || 0;
      return tokenBalance >= price;
    }
    return balance >= price;
  };

  //////////////////
  // HANDLERS

  const handleSubmit = async () => {
    playClick();
    let success = false;
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') success = await mint(quantity);
      else if (mode === 'ALT') bid(saleItem, quantity);
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') {
        success = await reroll(selectedKamis);
        if (success) setSelectedKamis([]);
      } else if (mode === 'ALT') {
        if (needsApproval) approve(payItem, price);
        bid(saleItem, quantity);
      }
    } else if (tab === 'MINT') {
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

  /////////////////
  // INTERPRETATION

  const getButtonText = () => {
    if (mode === 'ALT') return needsApproval ? 'Approve' : 'Bid';
    else if (tab === 'GACHA') return 'Mint';
    else if (tab === 'REROLL') return 'Reroll';
    else return '';
  };

  const getSubmitTooltip = () => {
    if (!enoughBalance) return ['too poore'];
    if (quantity <= 0) return ['no items to purchase'];

    let saleDesc = `Purchase ${quantity} ${saleItem.name}`;
    if (tab === 'GACHA') saleDesc = `Mint ${quantity} Kami`;
    if (tab === 'REROLL') saleDesc = `Reroll ${quantity} Kami`;
    return [saleDesc, `for ${price} ${payItem.name}`];
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Quantity type='string' value={quantity} onChange={(e) => handleChange(e)} />
      <Stepper
        value={quantity}
        set={setQuantity}
        scale={6}
        disableInc={!enoughBalance}
        disableDec={quantity <= 0}
        isHidden={tab === 'REROLL' && mode === 'DEFAULT'}
      />
      <Submit onClick={isDisabled ? undefined : handleSubmit} disabled={isDisabled}>
        <Tooltip text={getSubmitTooltip()} alignText='center' grow>
          {getButtonText()}
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
  border-radius: 0 0 1.05vw 0;
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
