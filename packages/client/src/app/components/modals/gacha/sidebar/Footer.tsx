import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Stepper, TextTooltip } from 'app/components/library';
import { GACHA_MAX_PER_TX } from 'constants/gacha';
import { Item } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { playClick, playSuccess } from 'utils/sounds';
import { TabType, ViewMode } from '../types';

export const Footer = ({
  actions,
  controls,
  data,
  state,
}: {
  actions: {
    approve: (payItem: Item, price: number) => void;
    bid: (item: Item, amt: number) => void;
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
    startTs?: number;
  };
  state: {
    quantity: number;
    setQuantity: (quantity: number) => void;
    price: number;
    setPrice: (price: number) => void;
    selectedKamis: Kami[];
    setSelectedKamis: (kamis: Kami[]) => void;
  };
}) => {
  const { approve, bid, pull, reroll } = actions;
  const { mode, tab } = controls;
  const { payItem, saleItem, balance, startTs } = data;
  const { selectedKamis, setSelectedKamis } = state;
  const { quantity, setQuantity, price } = state;

  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setIsDisabled(quantity <= 0 || needsFunds() || exceedsMax() || !hasStarted());
  }, [price, balance, quantity, startTs]);

  /////////////////
  // CHECKERS

  // check if a user is under max amt per tx
  const exceedsMax = () => {
    if (tab === 'GACHA' && mode === 'DEFAULT') return quantity > GACHA_MAX_PER_TX;
    return false;
  };

  // check if a user needs further spend approval for a token
  const needsApproval = () => {
    return false;
  };

  // check if a user has enough balance of a token to purchase
  const needsFunds = () => {
    return balance < price;
  };

  // check if the auction has started
  const hasStarted = () => {
    if (!startTs) return true;
    return startTs < Date.now() / 1000;
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
        else bid(saleItem, quantity);
      }
    }
    if (success) {
      playSuccess();
      if (tab !== 'REROLL') setQuantity(1);
      else setQuantity(0);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(0, rawQuantity);
    setQuantity(quantity);
  };

  /////////////////
  // INTERPRETATION

  // get the text of the submission button
  const getButtonText = () => {
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

  // get the sale description for the submit button tooltip
  const getSaleDescription = () => {
    // gacha
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') return [`Claim a Kami from the pool`];
      if (mode === 'ALT') return [`Purchase ${quantity} ${saleItem.name}(s)`];
    }

    // reroll
    if (tab === 'REROLL') {
      if (mode === 'DEFAULT') return [`Reroll ${selectedKamis.length} Kami`];
      if (mode === 'ALT') return [`Purchase ${quantity} ${saleItem.name}(s)`];
    }

    return [];
  };

  // get the error description for the submit button tooltip
  const getErrorDescription = () => {
    // gacha
    if (tab === 'GACHA') {
      if (mode === 'DEFAULT') {
        // if (!hasStarted()) return [`calm down`, `the pool isn't open yet`];
        if (exceedsMax()) return [`you can only claim ${GACHA_MAX_PER_TX} Kami at a time`];
      }
      if (mode === 'ALT') {
        if (!hasStarted()) return [`you're early!`, ``, `this auction hasn't started yet`];
      }
    }

    // reroll
    if (tab === 'REROLL') {
      if (mode === 'DEFAULT') {
        const numKamis = selectedKamis.length;
        if (numKamis == 0) {
          return [
            `you need to select at least one (1) Kami to disown`,
            `it's time to play favorites..`,
          ];
        }
      }
      if (mode === 'ALT') {
        if (!hasStarted()) return [`you're early!`, ``, `this auction hasn't started yet`];
      }
    }

    if (needsFunds()) return [`too poore`, `you need ${price - balance} more ${payItem.name}(s)`];

    return [];
  };

  // get the tooltip to display for the submit button
  const getSubmitTooltip = () => {
    let tooltip = getErrorDescription();
    if (tooltip.length === 0) tooltip = getSaleDescription();
    return tooltip;
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
        disableInc={needsFunds() || exceedsMax()}
        disableDec={quantity <= 0}
        isHidden={mode === 'DEFAULT' && tab !== 'GACHA'}
      />
      <Submit onClick={isDisabled ? undefined : handleSubmit} disabled={isDisabled}>
        <TextTooltip text={getSubmitTooltip()} alignText='center' grow>
          {getButtonText()}
        </TextTooltip>
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
