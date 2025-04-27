import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Stepper, Tooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { GACHA_MAX_PER_TX } from 'constants/gacha';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { TabType, ViewMode } from '../types';

interface Props {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
    mintPublic: (amount: number) => void;
    mintWL: () => void;
    pull: (amount: number) => Promise<boolean>;
    reroll: (kamis: Kami[]) => Promise<boolean>;
  };
  controls: {
    tab: TabType;
    mode: ViewMode;
  };
  data: {
    payItem: Item;
    saleItem: Item;
    balance: number;
    mint: {
      config: GachaMintConfig;
      data: {
        account: GachaMintData;
        gacha: GachaMintData;
      };
      whitelisted: boolean;
    };
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
  const { approve, bid, mintPublic, mintWL, pull, reroll } = actions;
  const { mode, tab } = controls;
  const { payItem, saleItem, balance, mint } = data;
  const { quantity, setQuantity, price, selectedKamis, setSelectedKamis } = state;

  /////////////////
  // ERC20 APPROVAL

  const { balances: tokenBal } = useTokens();
  const [needsApproval, setNeedsApproval] = useState(true);
  const [enoughBalance, setEnoughBalance] = useState(true);
  const [underMax, setUnderMax] = useState(true);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const needsApproval = checkNeedsApproval();
    const enoughBalance = checkEnoughBalance();
    const underMax = checkMax();
    setNeedsApproval(needsApproval);
    setEnoughBalance(enoughBalance);
    setUnderMax(underMax);
    setIsDisabled(quantity <= 0 || !enoughBalance || !underMax);
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

  // check if a user is under max amt per tx
  const checkMax = () => {
    if (tab === 'MINT') return underMintMax();

    if (mode === 'ALT') return true; // no max for auctions
    if (tab === 'GACHA' || tab === 'REROLL') return GACHA_MAX_PER_TX >= quantity;
    else return true;
  };

  // (MINT ONLY) check if a user is under the total mint allowance
  const underMintMax = () => {
    if (tab !== 'MINT') return true;

    const config = mint.config;
    const accountData = mint.data.account;
    if (mode === 'DEFAULT') return accountData.whitelist + quantity <= config.whitelist.max;
    if (mode === 'ALT') return accountData.public + quantity <= config.public.max;

    return true;
  };

  //////////////////
  // HANDLERS

  const handleSubmit = async () => {
    playClick();
    let success = false;
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') success = await pull(quantity);
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
      if (mode === 'DEFAULT') mintWL();
      else if (mode === 'ALT') mintPublic(quantity);
      else bid(saleItem, quantity);
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
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') return 'Mint';
      else if (mode === 'ALT') return 'Bid';
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') return 'Reroll';
      else if (mode === 'ALT') return needsApproval ? 'Approve' : 'Bid';
    } else if (tab === 'MINT') {
      return needsApproval ? 'Approve' : 'Bid';
    } else return '';
  };

  const getSubmitTooltip = () => {
    if (quantity <= 0) return ['no items to purchase'];
    if (tab === 'MINT') {
      if (mode === 'DEFAULT' && mint.whitelisted)
        return ['this purchase will exceed your WL mint limit'];
      if (!underMintMax()) {
        const max = mode === 'DEFAULT' ? mint.config.whitelist.max : mint.config.public.max;
        const curr = mode === 'DEFAULT' ? mint.data.account.whitelist : mint.data.account.public;
        return [`this purchase will exceed your mint limit`, `${curr}/${max} minted so far`];
      }
    }
    if (!enoughBalance) return ['too poore'];
    if (!underMax) return [`max ${GACHA_MAX_PER_TX} items per tx`];

    let saleDesc = `Purchase ${quantity} ${saleItem.name}`;
    if (tab === 'GACHA' && mode === 'DEFAULT') saleDesc = `Pull ${quantity} Kami`;
    if (tab === 'REROLL' && mode === 'DEFAULT') saleDesc = `Reroll ${quantity} Kami`;
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
