import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import { IconButton, IconListButtonOption, Overlay, Text } from 'app/components/library';
import { TextTooltip } from 'app/components/library/poppers';
import { useVisibility } from 'app/stores';
import { MUSU_INDEX, STONE_INDEX } from 'constants/items';
import { Account, Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { TRADE_ROOM_INDEX } from '../../constants';
import { LineItem } from './LineItem';

type Mode = 'Buy' | 'Sell';

interface Props {
  actions: {
    handleCreatePrompt: (want: Item[], wantAmt: number[], have: Item[], haveAmt: number[]) => void;
  };
  controls: {
    isConfirming: boolean;
  };
  data: {
    account: Account;
    currencies: Item[];
    inventory: Inventory[];
    items: Item[];
  };
  isVisible: boolean;
}

// a GUI for creating Simple Trade Offers (single buy/sell)
export const SingleCreate = (props: Props) => {
  const { actions, controls, data, isVisible } = props;
  const { handleCreatePrompt } = actions;
  const { isConfirming } = controls;
  const { account, currencies, inventory, items } = data;
  const { modals } = useVisibility();

  const [mode, setMode] = useState<Mode>('Buy');
  const [item, setItem] = useState<Item>(NullItem);
  const [amt, setAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [cost, setCost] = useState<number>(0);

  useEffect(() => {
    if (modals.trading) reset();
  }, [modals.trading]);

  const reset = () => {
    const musu = items.find((item) => item.index === MUSU_INDEX)!;
    const stone = items.find((item) => item.index === STONE_INDEX)!;
    setItem(stone);
    setAmt(1);
    setCurrency(musu);
    setCost(0);
  };

  /////////////////
  // INTERACTION

  // toggle between buy and sell modes
  const toggleMode = () => {
    if (mode === 'Buy') setMode('Sell');
    else setMode('Buy');
  };

  const triggerConfirmation = () => {
    const musu = items.find((item) => item.index === MUSU_INDEX)!;
    const want = mode === 'Buy' ? [item] : [musu];
    const wantAmt = mode === 'Buy' ? [amt] : [cost];
    const have = mode === 'Buy' ? [musu] : [item];
    const haveAmt = mode === 'Buy' ? [cost] : [amt];
    handleCreatePrompt(want, wantAmt, have, haveAmt);
  };

  // adjust and clean the Want amounts in the trade offer in respoonse to a form change
  const updateItemAmt = (event: ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');

    const min = 0;
    let max = Number.MAX_SAFE_INTEGER;
    if (mode === 'Sell') max = getInventoryBalance(inventory, item.index);
    const amt = Math.max(min, Math.min(max, rawQuantity));

    setAmt(amt);
  };

  const updateCost = (event: ChangeEvent<HTMLInputElement>) => {
    const min = 0;
    const quantityStr = event.target.value.replace(/[^\d.]/g, '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');

    let max = Number.MAX_SAFE_INTEGER;
    if (mode === 'Buy') max = getInventoryBalance(inventory, MUSU_INDEX);
    const amt = Math.max(min, Math.min(max, rawQuantity));
    setCost(amt);
  };

  /////////////////
  // INTERPRETATION

  // get the error message for the Create button based on the current state
  const getCreateError = () => {
    const tooltip = ['.'];

    // empty quantity constraint
    if (amt === 0 || cost === 0) tooltip.push('• quantities cannot be zero');

    // already confirming constraint
    if (isConfirming) tooltip.push('• you must address your current trade first');

    // location constraint
    if (account.roomIndex !== TRADE_ROOM_INDEX) {
      tooltip.push('• you cannot manipulate Trades outside of designated Trade Rooms');
    }

    // sell-side inventory balance constraint
    if (mode === 'Sell') {
      const balance = getInventoryBalance(inventory, item.index);
      if (amt > balance) tooltip.push('• you do not have enough items to sell');
    }

    // buy-side musu balance constraint
    if (mode === 'Buy') {
      const musuBalance = getInventoryBalance(inventory, MUSU_INDEX);
      if (cost > musuBalance) tooltip.push('• you do not have enough MUSU (poore)');
    }

    return tooltip;
  };

  /**
   * @notice get the options for what a player could offer in a trade
   * @param index the index of the selected item in the have state array
   */
  const getItemOptions = useMemo(
    () => (): IconListButtonOption[] => {
      // for buys we just return the entire catalog of items as options
      if (mode === 'Buy') {
        return items.map((item: Item) => {
          return {
            text: item.name,
            image: item.image,
            onClick: () => setItem(item),
          };
        });
      }

      /// for sells we have to check the inventory
      const filtered = inventory.filter((inv: Inventory) => {
        if (!inv || !inv.item) return false;
        const isTradeable = inv.item.is.tradeable;
        const hasBalance = inv.balance > 0;
        const unused = item !== inv.item;
        const notCurrency = inv.item.index !== MUSU_INDEX;
        return isTradeable && hasBalance && unused && notCurrency;
      });

      const sorted = filtered.sort((a, b) => a.item.name.localeCompare(b.item.name));

      return sorted.map((inv: Inventory) => {
        return {
          text: inv.item.name,
          image: inv.item.image,
          onClick: () => setItem(inv.item),
        };
      });
    },
    [mode, items.length, inventory.length]
  );

  /**
   * @notice get the options for what currencies a player could offer in a trade
   */
  const getCurrencyOptions = useMemo(
    () => (): IconListButtonOption[] => {
      return currencies.map((item: Item) => {
        return {
          text: item.name,
          image: item.image,
          onClick: () => setCurrency(item),
        };
      });
    },
    [currencies.length]
  );

  /////////////////
  // RENDER

  return (
    <Container isVisible={isVisible}>
      <Row>
        <Text size={1.2}>I want to</Text>
        <IconButton text={`<${mode}>`} onClick={toggleMode} />
      </Row>
      <Row>
        <LineItem
          options={getItemOptions()}
          selected={item}
          amt={amt}
          setAmt={(e) => updateItemAmt(e)}
          reverse
        />
      </Row>
      <Row>
        <Text size={1.2}>for</Text>
      </Row>
      <Row>
        <LineItem
          options={getCurrencyOptions()}
          selected={currency}
          amt={cost}
          setAmt={(e) => updateCost(e)}
          reverse
        />
      </Row>
      <Overlay bottom={0.75} right={0.75}>
        <TextTooltip
          title={`${mode} for ${amt} ${item.name} for ${cost} MUSU`}
          text={getCreateError()}
          alignText='left'
          maxWidth={24}
        >
          <IconButton
            text='Create'
            onClick={triggerConfirmation}
            disabled={
              isConfirming || cost === 0 || amt === 0 || account.roomIndex !== TRADE_ROOM_INDEX // TODO: check this based on room flags
            }
          />
        </TextTooltip>
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  position: relative;
  width: 100%;
  height: 100%;

  flex-flow: column nowrap;
  padding: 6vw 0.6vw 0.6vw 0.6vw;
`;

const Row = styled.div`
  width: 100%;
  padding: 0.6vw;

  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;
