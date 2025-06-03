import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useState } from 'react';
import styled from 'styled-components';

import {
  ActionButton,
  IconButton,
  IconListButton,
  IconListButtonOption,
  Overlay,
  Text,
} from 'app/components/library';
import { Inventory } from 'network/shapes';
import { Item, NullItem } from 'network/shapes/Item';
import { ActionComponent } from 'network/systems';
import { waitForActionCompletion } from 'network/utils';

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

  const [item, setItem] = useState<Item>(NullItem);
  const [itemAmt, setItemAmt] = useState<number>(1);
  const [currency, setCurrency] = useState<Item>(NullItem);
  const [currencyAmt, setCurrencyAmt] = useState<number>(1);
  const [isSelling, setIsSelling] = useState<boolean>(true);

  const reset = () => {
    setItem(items[0]);
    setItemAmt(0);
    setCurrency(currencies[0]);
    setCurrencyAmt(0);
  };

  /////////////////
  // ACTIONS

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

  return (
    <Container>
      <Text size={1.5}> Create Offer</Text>
      <Body>
        <Row>
          <Text size={0.9}>I want to</Text>
          <IconButton
            text={isSelling ? 'Sell' : 'Buy'}
            scale={2.7}
            onClick={() => {
              reset();
              setIsSelling(!isSelling);
            }}
          />
          100
          <IconListButton img={item.image} options={getItemOptions()} />
        </Row>
        <Row>
          <Text size={0.9}>for</Text>
          <IconListButton img={currency.image} options={getCurrencyOptions()} />
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
  width: 40%;
  height: 100%;
  padding: 0 0.6vw;
  overflow: hidden hidden;
`;

const Body = styled.div`
  position: relative;
  height: 100%;

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
  justify-content: flex-start;
  gap: 0.6vw;
`;
