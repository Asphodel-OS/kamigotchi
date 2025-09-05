import { ChangeEvent, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { IconListButton, IconListButtonOption, Text } from 'app/components/library';
import { IconButton } from 'app/components/library/buttons';
import { useTokens } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { Account, Inventory, Item, Receipt } from 'network/shapes';
import { playClick } from 'utils/sounds';
import { Mode } from './types';

export const Controls = ({
  actions,
  data,
  state,
}: {
  actions: {
    approve: (item: Item, amt: number) => Promise<void>;
    deposit: (item: Item, amt: number) => Promise<void>;
    withdraw: (item: Item, amt: number) => Promise<void>;
    claim: (receiptID: Receipt) => Promise<void>;
    cancel: (receiptID: Receipt) => Promise<void>;
  };
  data: {
    account: Account;
    inventory: Inventory[];
  };
  state: {
    selected: Item;
    setSelected: (item: Item) => void;
    options: Item[];
    setOptions: (items: Item[]) => void;
  };
}) => {
  const { approve, deposit, withdraw } = actions;
  const { account, inventory } = data;
  const { selected, setSelected, options, setOptions } = state;

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
    playClick();
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = cleanAmount(rawQuantity);
    setAmt(amt);
  };

  // get the action to perform based on the mode
  const triggerAction = () => {
    if (mode === 'DEPOSIT') {
      const tokenAmt = amt / getConversionRate(selected);
      if (tokenAmt > onyxAllowance) approve(selected, tokenAmt);
      else deposit(selected, amt);
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
    else max = getTokenBalance(selected) * getConversionRate(selected);
    return Math.max(0, Math.min(max, raw));
  };

  // get the icon for the Mode toggle
  const getModeIcon = (mode: Mode) => {
    if (mode === 'DEPOSIT') return ArrowIcons.left;
    else return ArrowIcons.right;
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
  const getConversionRate = (item: Item) => {
    return 10 ** (item.token?.scale ?? 0);
  };

  // get the token balance of the selected item
  const getTokenBalance = (item: Item) => {
    const scale = getConversionRate(item);
    return (1.0 * Math.trunc(onyxBalance * scale)) / scale;
  };

  // get the action text of the submission button
  const getActionText = () => {
    if (mode === 'DEPOSIT') {
      const tokenAmt = amt / getConversionRate(selected);
      if (tokenAmt > onyxAllowance) return 'Approve';
      else return 'Deposit';
    } else return 'Withdraw';
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
          />
          <Input type='text' value={amt} onChange={handleInputChange} />
        </Column>
        <Column style={{ width: '6vw' }}>
          <Text size={0.9}>{mode}</Text>
          <IconButton img={getModeIcon(mode)} onClick={toggleMode} />
          <Text size={0.6}>{`(${getConversionRate(selected)}:1)`}</Text>
        </Column>
        <Column>
          <IconButton
            img={selected.image}
            scale={4.2}
            balance={getTokenBalance(selected)}
            onClick={() => {}}
          />
          <Input type='text' value={amt / getConversionRate(selected)} disabled />
        </Column>
      </Row>
      <IconButton text={getActionText()} onClick={triggerAction} />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  gap: 1.2vw;
  padding: 3vw 0.6vw 1.2vw 0.6vw;

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
  width: 6vw;
  height: 100%;
  padding: 0.3vw;

  margin: 0w;
  cursor: text;

  color: black;
  font-size: 1vw;
  line-height: 1.5vw;
  text-align: center;
`;
