import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Dispatch, useEffect, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import {
  ActionButton,
  IconButton,
  IconListButton,
  IconListButtonOption,
  Overlay,
  Pairing,
  Text,
  TextTooltip,
} from 'app/components/library';
import { useVisibility } from 'app/stores';
import { MUSU_INDEX, STONE_INDEX } from 'constants/items';
import { Account, Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { ActionComponent } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import { playClick } from 'utils/sounds';
import { abbreviateString } from 'utils/strings';
import { ConfirmationData } from '../Confirmation';
import { TRADE_ROOM_INDEX } from '../constants';
import { CreateMode } from '../types';

interface Props {
  actions: {
    createTrade: (
      buyItem: Item,
      buyAmt: number,
      sellItem: Item,
      sellAmt: number
    ) => EntityID | void;
  };
  controls: {
    isConfirming: boolean;
    setIsConfirming: Dispatch<boolean>;
    setConfirmData: Dispatch<ConfirmationData>;
  };
  data: {
    account: Account;
    currencies: Item[];
    items: Item[];
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
  };
}

export const Create = (props: Props) => {
  const { actions, controls, data, types, utils } = props;
  const { createTrade } = actions;
  const { isConfirming, setIsConfirming } = controls;
  const { setConfirmData } = controls;
  const { account, currencies, items } = data;
  const { ActionComp } = types;
  const { entityToIndex } = utils;
  const { modals } = useVisibility();

  const [item, setItem] = useState<Item>(NullItem);
  const [itemAmt, setItemAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [currencyAmt, setCurrencyAmt] = useState<number>(1);
  const [mode, setMode] = useState<CreateMode>(CreateMode.BUY);

  useEffect(() => {
    if (modals.trading) reset();
  }, [modals.trading]);

  // reset the form when the mode is toggled
  useEffect(() => {
    reset();
  }, [mode]);

  const reset = () => {
    if (mode === CreateMode.BUY) {
      const stone = items.find((item) => item.index === STONE_INDEX);
      setItem(stone ?? NullItem);
      setItemAmt(1);
    } else if (mode === CreateMode.SELL) {
      if (!account.inventories) return;
      setItem(account.inventories[0].item ?? NullItem);
      setItemAmt(1);
    }

    if (currencies.length > 0) setCurrency(currencies[0]);
  };

  /////////////////
  // HANDLERS

  // adjust and clean the currency amount in the trade offer in respoonse to a form change
  // TODO: update this to support other currencies
  const handleCurrencyAmtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const min = 0;
    let max = Infinity;
    if (mode === CreateMode.BUY) {
      max = getInventoryBalance(account.inventories ?? [], MUSU_INDEX);
    }

    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = Math.max(min, Math.min(max, rawQuantity));
    setCurrencyAmt(amt);
  };

  // adjust and clean the item amount in the trade offer in respoonse to a form change
  const handleItemAmtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const min = 0;
    let max = Infinity;
    if (mode === CreateMode.SELL) {
      max = getInventoryBalance(account.inventories ?? [], item.index);
    }

    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = Math.max(min, Math.min(max, rawQuantity));
    setItemAmt(amt);
  };

  // organize the form data for trade offer creation
  // TODO: detect successful trade creation and reset form
  const handleTrade = async (item: Item, itemAmt: number, currency: Item, currencyAmt: number) => {
    const buyItem = mode === CreateMode.BUY ? item : currency;
    const buyAmt = mode === CreateMode.BUY ? itemAmt : currencyAmt;
    const sellItem = mode === CreateMode.BUY ? currency : item;
    const sellAmt = mode === CreateMode.BUY ? currencyAmt : itemAmt;

    try {
      const tradeActionID = createTrade(buyItem, buyAmt, sellItem, sellAmt);
      if (!tradeActionID) throw new Error('Trade action failed');
      await waitForActionCompletion(ActionComp, entityToIndex(tradeActionID) as EntityIndex);
    } catch (e) {
      console.log('handleTrade() failed', e);
    }
  };

  // handle prompting for confirmation with trade creation
  const handleCreatePrompt = () => {
    const confirmAction = () => handleTrade(item, itemAmt, currency, currencyAmt);
    setConfirmData({
      title: 'Confirm Creation',
      content: getConfirmContent(),
      onConfirm: confirmAction,
    });
    setIsConfirming(true); // TODO: this is a hack to get the confirmation to show
    playClick();
  };

  /////////////////
  // INTERPRETATION

  const getCurrencyOptions = (): IconListButtonOption[] => {
    return currencies.map((item: Item) => {
      return {
        text: item.name,
        image: item.image,
        onClick: () => {
          setCurrency(item);
          setCurrencyAmt(1);
        },
      };
    });
  };

  const getItemOptions = (): IconListButtonOption[] => {
    // if buying, show all tradable items
    if (mode === CreateMode.BUY) {
      return items.map((item: Item) => {
        return {
          text: item.name,
          image: item.image,
          onClick: () => {
            setItem(item);
            setItemAmt(1);
          },
        };
      });
    }

    // if selling, show only tradable items in inventory
    if (!account.inventories) return [];
    const filtered = account.inventories.filter((inv: Inventory) => {
      const isTradeable = inv.item.is.tradeable;
      const hasBalance = inv.balance > 0;
      const isNotCurrency = inv.item.index !== MUSU_INDEX;
      return isTradeable && hasBalance && isNotCurrency;
    });

    return filtered.map((inv: Inventory) => {
      return {
        text: inv.item.name,
        image: inv.item.image,
        onClick: () => {
          setItem(inv.item);
          setItemAmt(1);
        },
      };
    });
  };

  /////////////////
  // DISPLAY

  // create the trade confirmation window content
  // TODO: adjust Buy amounts for tax and display breakdown in tooltip
  const getConfirmContent = () => {
    const buyItem = mode === CreateMode.BUY ? item : currency;
    const buyAmt = mode === CreateMode.BUY ? itemAmt : currencyAmt;
    const sellItem = mode === CreateMode.BUY ? currency : item;
    const sellAmt = mode === CreateMode.BUY ? currencyAmt : itemAmt;
    const tradeConfig = account.config?.trade;
    const tradeFee = tradeConfig?.fee ?? 0;

    let tax = 0;
    let taxTooltip: string[] = [];
    const taxConfig = account.config?.trade.tax;
    if (taxConfig && mode === CreateMode.SELL) {
      tax = Math.floor(buyAmt * taxConfig.value);
      const taxPercent = Math.floor(taxConfig.value * 100).toFixed(2);
      taxTooltip = [`${buyAmt.toLocaleString()} MUSU`, `less ${taxPercent}% tax (${tax} MUSU)`];
    }

    return (
      <Paragraph>
        <Row>
          <Text size={1.2}>{'('}</Text>
          <Pairing
            text={sellAmt.toLocaleString()}
            icon={sellItem.image}
            tooltip={[`${sellAmt.toLocaleString()} ${sellItem.name}`]}
          />
          <Text size={1.2}>{`) will be transferred to the Trade.`}</Text>
        </Row>
        <Row>
          <Text size={1.2}>{'You will receive ('}</Text>
          <Pairing
            text={(buyAmt - tax).toLocaleString()}
            icon={buyItem.image}
            tooltip={taxTooltip}
          />
          <Text size={1.2}>{`) upon Completion.`}</Text>
        </Row>
        <Row>
          <Text size={0.9}>{`Listing Fee: (`}</Text>
          <Pairing
            text={tradeFee.toLocaleString()}
            icon={currency.image}
            scale={0.9}
            tooltip={[
              `Non-refundable (trade responsibly)`,
              `Deducted from your inventory upon creation.`,
            ]}
          />
          <Text size={0.9}>{`)`}</Text>
        </Row>
      </Paragraph>
    );
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Title>Create Offer</Title>
      <Body>
        <Row>
          <Text size={1.2}>I want to</Text>
          <ActionButton
            text={`< ${mode} >`}
            onClick={() => setMode(mode === CreateMode.BUY ? CreateMode.SELL : CreateMode.BUY)}
          />
        </Row>
        <Row>
          <Quantity
            width={7.5}
            type='string'
            value={itemAmt.toLocaleString()}
            onChange={(e) => handleItemAmtChange(e)}
          />
          <TextTooltip title={item.name} text={[item.description]}>
            <IconListButton
              img={item.image}
              scale={2.7}
              text={abbreviateString(item.name, 16)}
              options={getItemOptions()}
            />
          </TextTooltip>
        </Row>
        <Row>
          <Text size={1.2}>for</Text>
          <Quantity
            width={9}
            type='string'
            value={currencyAmt.toLocaleString()}
            onChange={(e) => handleCurrencyAmtChange(e)}
          />
          <IconListButton
            img={currency.image}
            scale={2.7}
            text={abbreviateString(currency.name, 16)}
            options={getCurrencyOptions()}
          />
        </Row>
      </Body>
      <Overlay bottom={0.75} right={0.75}>
        <IconButton
          text='Create'
          onClick={handleCreatePrompt}
          disabled={
            isConfirming ||
            item.index === 0 ||
            itemAmt === 0 ||
            currency.index === 0 ||
            currencyAmt === 0 ||
            account.roomIndex !== TRADE_ROOM_INDEX // dtl check this based on room flags
          }
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: 0.15vw solid black;

  width: 40%;
  height: 100%;

  user-select: none;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Body = styled.div`
  position: relative;
  height: 50%;
  margin: 1.8vw 0.6vw;
  gap: 1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  scrollbar-color: transparent transparent;
`;

const Row = styled.div`
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;

const Paragraph = styled.div`
  color: #333;
  flex-grow: 1;
  padding: 1.8vw;
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-evenly;
  align-items: center;
`;

const Quantity = styled.input<{ width?: number }>`
  border: none;
  background-color: #eee;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  width: ${({ width }) => width ?? 6}vw;
  height: 100%;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;

  color: black;
  font-size: 1.2vw;
  text-align: center;
`;
