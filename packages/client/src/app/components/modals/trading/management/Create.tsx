import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { getInventoryBalance } from 'app/cache/inventory';
import {
  ActionButton,
  IconButton,
  IconListButton,
  IconListButtonOption,
  Overlay,
  Text,
  TextTooltip,
} from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { ActionComponent } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';
import { abbreviateString } from 'utils/strings';

interface Props {
  actions: {
    createTrade: (item: Item, itemAmt: number, currency: Item, currencyAmt: number) => EntityID;
  };
  data: {
    currencies: Item[];
    inventories: Inventory[];
    items: Item[];
    musuBalance: number;
  };
  types: {
    ActionComp: ActionComponent;
  };
  utils: {
    entityToIndex: (id: EntityID) => EntityIndex;
  };
}

export const Create = (props: Props) => {
  const { actions, data, types, utils } = props;
  const { createTrade } = actions;
  const { musuBalance, currencies, items, inventories } = data;
  const { ActionComp } = types;
  const { entityToIndex } = utils;
  const { modals } = useVisibility();

  const [item, setItem] = useState<Item>(NullItem);
  const [itemAmt, setItemAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [currencyAmt, setCurrencyAmt] = useState<number>(1);
  const [isSelling, setIsSelling] = useState<boolean>(true);

  useEffect(() => {
    if (modals.trading) reset();
  }, [modals.trading]);

  const reset = () => {
    setItem(items[0]);
    setItemAmt(0);
    setCurrency(currencies[0]);
    setCurrencyAmt(1);
  };

  /////////////////
  // HANDLERS

  // adjust and clean the currency amount in the trade offer in respoonse to a form change
  // TODO: update this to support other currencies
  const handleCurrencyAmtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const min = 1;
    let max = Infinity;
    if (!isSelling) max = musuBalance;

    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = Math.max(min, Math.min(max, rawQuantity));
    setCurrencyAmt(amt);
  };

  // adjust and clean the item amount in the trade offer in respoonse to a form change
  const handleItemAmtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const min = 1;
    let max = Infinity;
    if (isSelling) max = getInventoryBalance(inventories, item.index);

    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr.replaceAll(',', '') || '0');
    const amt = Math.max(min, Math.min(max, rawQuantity));
    setItemAmt(amt);
  };

  // organize the form data for trade offer creation
  // TODO: make reset only happen if trade is succesful
  const handleTrade = async (item: Item, itemAmt: number, currency: Item, currencyAmt: number) => {
    const buyItem = isSelling ? item : currency;
    const buyAmt = isSelling ? itemAmt : currencyAmt;
    const sellItem = isSelling ? currency : item;
    const sellAmt = isSelling ? currencyAmt : itemAmt;

    try {
      const tradeActionID = createTrade(buyItem, buyAmt, sellItem, sellAmt);
      if (!tradeActionID) throw new Error('Trade action failed');
      await Promise.all([
        waitForActionCompletion(ActionComp, entityToIndex(tradeActionID) as EntityIndex),
        reset(),
      ]);
    } catch (e) {
      console.log('handleTrade() failed', e);
    }
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
    if (!isSelling) {
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

    return inventories.map((inv: Inventory) => {
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

  return (
    <Container>
      <Text size={1.8}>Create Offer</Text>
      <Body>
        <Row>
          <Text size={1.2}>I want to</Text>
          <IconButton
            text={isSelling ? 'Sell' : 'Buy'}
            scale={2.7}
            onClick={() => {
              if (!isSelling) reset();
              setIsSelling(!isSelling);
            }}
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
        <ActionButton
          text='Create'
          onClick={() => {
            handleTrade(item, itemAmt, currency, currencyAmt);
          }}
          disabled={item.index === 0 || itemAmt === 0 || currency.index === 0 || currencyAmt === 0}
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
  padding: 1.2vw 0.6vw;

  overflow: hidden hidden;
`;

const Body = styled.div`
  position: relative;
  height: 100%;
  margin: 1.8vw 0.6vw;
  gap: 1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  overflow-y: scroll;
  scrollbar-color: transparent transparent;
`;

const Row = styled.div`
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
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
