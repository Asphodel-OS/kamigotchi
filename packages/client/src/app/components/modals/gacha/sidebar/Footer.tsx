import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Stepper, Tooltip } from 'app/components/library';
import { useTokens } from 'app/stores';
import { GACHA_MAX_PER_TX } from 'constants/gacha';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick, playSuccess } from 'utils/sounds';
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
    tick: number;
  };
}

export const Footer = (props: Props) => {
  const { actions, controls, data, state } = props;
  const { approve, bid, mintPublic, mintWL, pull, reroll } = actions;
  const { mode, tab } = controls;
  const { payItem, saleItem, balance, mint } = data;
  const { selectedKamis, setSelectedKamis } = state;
  const { quantity, setQuantity, price, tick } = state;

  const { balances: tokenBal } = useTokens();
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setIsDisabled(quantity <= 0 || needsFunds() || exceedsMax() || !hasStarted());
  }, [tokenBal, price, balance, quantity]);

  /////////////////
  // CHECKERS

  // check if a user is under max amt per tx
  const exceedsMax = () => {
    if (tab === 'MINT') {
      const whitelistMax = mint.config.whitelist.max;
      const publicMax = mint.config.public.max;
      const whitelistMinted = mint.data.account.whitelist;
      const publicMinted = mint.data.account.public;
      if (mode === 'DEFAULT') return whitelistMinted + quantity > whitelistMax;
      if (mode === 'ALT') return publicMinted + quantity > publicMax;
    }

    if (tab === 'GACHA' && mode === 'DEFAULT') return quantity > GACHA_MAX_PER_TX;

    return false;
  };

  // hardcoded bc this only matters temporarily
  const hasStarted = () => {
    const now = tick / 1000;
    const wlMintStart = data.mint.config.whitelist.startTs;
    const publicMintStart = data.mint.config.public.startTs;

    if (tab === 'MINT') {
      if (mode === 'DEFAULT') return now >= wlMintStart;
      else return now >= publicMintStart;
    } else if (tab === 'GACHA') return now >= publicMintStart + 3600;
    else if (tab === 'REROLL' && mode === 'ALT') return now >= publicMintStart + 3600;
    return true;
  };

  // check if a user needs further spend approval for a token
  const needsApproval = () => {
    if (!payItem.address) return false;
    const allowance = tokenBal.get(payItem.address!)?.allowance || 0;
    return allowance < price;
  };

  // check if a user has enough balance of a token to purchase
  const needsFunds = () => {
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
      if (mode === 'DEFAULT') success = await pull(quantity);
      else if (mode === 'ALT') bid(saleItem, quantity);
    } else if (tab === 'REROLL') {
      if (mode === 'DEFAULT') {
        success = await reroll(selectedKamis);
        if (success) setSelectedKamis([]);
      } else if (mode === 'ALT') {
        if (needsApproval()) approve(payItem, price);
        bid(saleItem, quantity);
      }
    } else if (tab === 'MINT') {
      if (needsApproval()) approve(payItem, price);
      if (mode === 'DEFAULT') mintWL();
      else if (mode === 'ALT') mintPublic(quantity);
      else bid(saleItem, quantity);
    }
    if (success) {
      playSuccess();
      setQuantity(0);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, Math.min(balance, rawQuantity));
    setQuantity(quantity);
  };

  /////////////////
  // INTERPRETATION

  // get the text of the submission button
  const getButtonText = () => {
    // mint tab
    if (tab === 'MINT') return needsApproval() ? 'Approve' : 'Mint';

    // gacha pool tab
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') return 'Claim';
      else if (mode === 'ALT') return 'Bid';
    }

    // reroll tab
    if (tab === 'REROLL') {
      if (mode === 'DEFAULT') return 'Reroll';
      else if (mode === 'ALT') return needsApproval() ? 'Approve' : 'Bid';
    }
    return '';
  };

  const getSubmitTooltip = () => {
    if (quantity <= 0) return ['no items to purchase'];

    // mint
    if (tab === 'MINT') {
      if (mode === 'DEFAULT') {
        if (!hasStarted()) return ['whitelist mint has not started'];
        if (exceedsMax()) return [`max ${mint.config.whitelist.max} for whitelist mint`];
        if (!mint.whitelisted) return [`you're not whitelisted`];
      } else {
        if (!hasStarted()) return ['public mint has not started'];
      }

      if (exceedsMax()) {
        const max = mode === 'DEFAULT' ? mint.config.whitelist.max : mint.config.public.max;
        const curr = mode === 'DEFAULT' ? mint.data.account.whitelist : mint.data.account.public;
        return [`this purchase will exceed your mint limit`, `${curr}/${max} minted so far`];
      }
    }

    if (needsFunds()) return ['too poore'];
    if (exceedsMax()) return [`max ${GACHA_MAX_PER_TX} items per tx`];

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
        disableInc={needsFunds() && exceedsMax()}
        disableDec={quantity <= 0}
        isHidden={mode === 'DEFAULT'}
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
