import { ChangeEvent, KeyboardEvent, useState } from 'react';
import styled from 'styled-components';

import { PortalConfigs } from 'app/cache/config';
import { getInventoryBalance } from 'app/cache/inventory';
import { IconListButton, IconListButtonOption, Text, TextTooltip } from 'app/components/library';
import { IconButton } from 'app/components/library/buttons';
import { useTokens } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { TokenIcons } from 'assets/images/tokens';
import { Account, Inventory, Item } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { getNeededDeposit, getResultWithdraw } from '../utils';
import { Mode } from './types';

export const Swap = ({
  actions,
  data,
  state,
}: {
  actions: {
    approve: (item: Item, amt: number) => Promise<void>;
    deposit: (item: Item, amt: number, convertAmt: number) => Promise<void>;
    withdraw: (item: Item, amt: number) => Promise<void>;
  };
  data: {
    account: Account;
    config: PortalConfigs;
    inventory: Inventory[];
  };
  state: {
    options: Item[];
    selected: Item;
    setSelected: (item: Item) => void;
  };
}) => {
  const { approve, deposit, withdraw } = actions;
  const { account, config, inventory } = data;
  const { options, selected, setSelected } = state;
  // hardcoded for now to just onyx
  const { allowance: onyxAllowance, balance: onyxBalance } = useTokens((s) => s.onyx);

  const [mode, setMode] = useState<Mode>('DEPOSIT');
  const [amt, setAmt] = useState<number>(0);

  /////////////////
  // INTERACTION

  // toggle between depositing and withdrawing
  const toggleMode = () => {
    if (mode === 'DEPOSIT') setMode('WITHDRAW');
    else setMode('DEPOSIT');
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = cleanAmount(rawQuantity);
    setAmt(amt);
  };

  // trigger the action when the user presses enter
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isDisabled()) {
      triggerAction();
      playClick();
    }
  };

  // get the action to perform based on the mode
  const triggerAction = () => {
    if (mode === 'DEPOSIT') {
      const neededAmt = getNeededDeposit(config, amt);
      const tokenAmt = neededAmt / getSwapRate(selected);
      if (tokenAmt > onyxAllowance) approve(selected, tokenAmt);
      else deposit(selected, amt, neededAmt);
    } else {
      withdraw(selected, amt);
    }
  };

  /////////////////
  // INTERPRETATION

  // clean input balances within min/max bounds, based on mode
  const cleanAmount = (raw: number) => {
    let max = Number.MAX_SAFE_INTEGER;
    if (mode === 'WITHDRAW') max = getInventoryBalance(inventory, selected.index);
    else max = getTokenBalance(selected) * getSwapRate(selected);
    return Math.max(0, Math.min(max, raw));
  };

  // generate the selectable list of ERC20 items
  const getItemOptions = (): IconListButtonOption[] => {
    return options.map((item) => ({
      text: item.name,
      image: item.image,
      onClick: () => setSelected(item),
    }));
  };

  // get the balance conversion rate from token to item
  const getSwapRate = (item: Item) => {
    return 10 ** (item.token?.scale ?? 0);
  };

  // get the conversion rate from item balance to token balance with tax applied
  const getTokenConversion = (amt: number) => {
    let converted = 0;
    if (mode === 'DEPOSIT') converted = getNeededDeposit(config, amt);
    else converted = getResultWithdraw(config, amt);
    return converted / getSwapRate(selected);
  };

  // get the token balance of the selected item
  // NOTE: hardcoded to onyx for now
  const getTokenBalance = (item: Item) => {
    const scale = getSwapRate(item);
    return (1.0 * Math.trunc(onyxBalance * scale)) / scale;
  };

  /////////////////
  // DISPLAY

  // get the action text of the submission button
  const getActionText = () => {
    if (mode === 'DEPOSIT') {
      const tokenAmt = amt / getSwapRate(selected);
      if (tokenAmt > onyxAllowance) return 'Approve';
      else return 'Deposit';
    } else return 'Withdraw';
  };

  // get the icon for the Mode toggle
  const getModeIcon = (mode: Mode) => {
    if (mode === 'DEPOSIT') return ArrowIcons.left;
    else return ArrowIcons.right;
  };

  // get the tooltip for the tax rate
  const getRateTooltip = () => {
    const swapRate = getSwapRate(selected);
    if (mode === 'DEPOSIT') {
      const { flat, rate: taxRate } = config.tax.import;
      const taxAmt = Math.floor(amt * taxRate) + flat;
      const effectiveTaxRate = (100 * taxAmt) / amt;

      return [
        `The base conversion rate from $ONYX to ${selected.name} is 1:${swapRate}`,
        `\n`,
        `A tax rate of ${taxRate * 100}% (rounded down) is applied to the converted item balance. As well as a flat fee of ${flat} unit(s) per deposit.`,
        `\n`,
        `This will result in a total import tax of ${taxAmt} unit(s) or ${effectiveTaxRate.toFixed(2)}% of the total deposit.`,
      ];
    } else if (mode === 'WITHDRAW') {
      const { flat, rate: taxRate } = config.tax.export;
      const taxAmt = Math.floor(amt * taxRate) + flat;
      const effectiveTaxRate = (100 * taxAmt) / amt;

      return [
        `The base conversion rate from ${selected.name} to $ONYX is ${swapRate}:1`,
        `\n`,
        `A tax rate of ${taxRate * 100}% (rounded down) is applied to the withdrawn item balance. As well as a flat fee of ${flat} unit(s) per withdrawal.`,
        `\n`,
        `This will result in a total export tax of ${taxAmt} unit(s) or ${effectiveTaxRate.toFixed(2)}% of the total withdrawal.`,
      ];
    }
    return [];
  };

  const isDisabled = () => {
    if (amt === 0) return true;
  };

  /////////////////
  // DISPLAY

  return (
    <Container>
      <Row>
        <Column>
          <IconListButton
            img={selected.image}
            scale={4.2}
            options={getItemOptions()}
            balance={getInventoryBalance(inventory, selected.index)}
            tooltip={{ text: [`Select an item to ${mode}`] }}
          />
          <Input type='text' value={amt} onChange={handleInputChange} onKeyDown={handleKeyDown} />
        </Column>
        <Column style={{ width: '6vw' }}>
          <Text size={0.9}>{mode}</Text>
          <IconButton img={getModeIcon(mode)} onClick={toggleMode} />
          <TextTooltip text={getRateTooltip()} size={0.6} maxWidth={24}>
            <Text size={0.6}>{`(${getSwapRate(selected)}:1)`}</Text>
          </TextTooltip>
        </Column>
        <Column>
          <IconButton
            img={TokenIcons.onyx} // hardcoded for now
            scale={4.2}
            balance={getTokenBalance(selected)}
            onClick={() => {}}
            disabled
          />
          <Input type='text' value={getTokenConversion(amt)} disabled />
        </Column>
      </Row>
      <IconButton
        text={getActionText()}
        scale={3}
        onClick={triggerAction}
        disabled={isDisabled()}
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  gap: 1.2vw;
  padding: 3.6vw 0.6vw 1.2vw 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: center;
`;

const Column = styled.div`
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
`;

const Input = styled.input`
  border-radius: 0.45vw;
  background-color: #eee;
  width: 9vw;
  height: 100%;

  padding: 0.3vw;

  color: black;
  font-size: 1vw;
  line-height: 1.5vw;
  text-align: center;
`;
