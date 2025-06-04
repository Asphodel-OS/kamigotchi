import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccountInventories } from 'app/cache/account';
import { cleanInventories, getInventoryBalance } from 'app/cache/inventory';
import { getTrade } from 'app/cache/trade';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { MUSU_INDEX } from 'constants/items';
import { Inventory } from 'network/shapes';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllItems, getMusuBalance, Item } from 'network/shapes/Item';
import { queryTrades } from 'network/shapes/Trade';
import { Trade } from 'network/shapes/Trade/types';
import { Management } from './management';
import { OrderbookTab } from './orderbook';
import { Tabs } from './Tabs';
import { TabType } from './types';

const SYNC_TIME = 3333;

export function registerTradingModal() {
  registerUIComponent(
    'TradingModal',
    // Grid Config
    {
      colStart: 2,
      colEnd: 67,
      rowStart: 8,
      rowEnd: 99,
    },
    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components, actions } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          return {
            network,
            data: { accountEntity },
            types: {
              ActionComp: actions.Action,
            },
            utils: {
              entityToIndex: (id: EntityID) => world.entityToIndex.get(id)!,
              getAllItems: () => getAllItems(world, components),
              getInventories: () => getAccountInventories(world, components, accountEntity),
              getTrade: (entity: EntityIndex) => getTrade(world, components, entity),
              queryTrades: () => queryTrades(components),

              getMusuBalance: () => getMusuBalance(world, components, accountEntity),
            },
          };
        })
      ),

    // Render
    ({ network, data, types, utils }) => {
      const { actions, api } = network;
      const { getAllItems, getInventories, getTrade, queryTrades } = utils;
      const { modals } = useVisibility();

      const [trades, setTrades] = useState<Trade[]>([]);
      const [myTrades, setMyTrades] = useState<Trade[]>([]);
      const [currencies, setCurrencies] = useState<Item[]>([]);
      const [inventories, setInventories] = useState<Inventory[]>([]);
      const [items, setItems] = useState<Item[]>([]);
      const [musuBalance, setMusuBalance] = useState<number>(0);

      const [tab, setTab] = useState<TabType>('Orderbook');
      const [tick, setTick] = useState(Date.now());

      // time trigger to use for periodic refreshes
      useEffect(() => {
        refreshItems();

        const updateSync = () => setTick(Date.now());
        const timerId = setInterval(updateSync, SYNC_TIME);
        return () => clearInterval(timerId);
      }, []);

      // sets trades upon opening modal
      useEffect(() => {
        if (!modals.trading) return;
        refreshTrades();
        refreshInventories();
      }, [modals.trading, tick]);

      /////////////////
      // GETTERS

      // pull all items from the registry and save the tradable ones
      const refreshItems = () => {
        const all = getAllItems();
        const tradable = all.filter((item) => !!item.is.tradeable);
        tradable.sort((a, b) => (a.name > b.name ? 1 : -1));
        setItems(tradable);
        setCurrencies([all.find((item) => item.index === 1)!]);
      };

      // pull all inventories from the player. filter out MUSU and untradable items
      const refreshInventories = () => {
        const all = getInventories();
        setMusuBalance(getInventoryBalance(all, MUSU_INDEX));
        const filtered = cleanInventories(all);
        const tradable = filtered.filter((inv) => inv.item.is.tradeable);
        const sorted = tradable.sort((a, b) => (a.item.name > b.item.name ? 1 : -1));
        setInventories(sorted);
      };

      // pull all open trades and partition them based on whether created by the player
      const refreshTrades = () => {
        const allTrades = queryTrades().map((entity: EntityIndex) => getTrade(entity));
        const myTrades = allTrades.filter(
          (trade) =>
            trade.seller?.entity === data.accountEntity ||
            trade.buyer?.entity === data.accountEntity
        );
        const trades = allTrades.filter(
          (trade) =>
            trade.seller?.entity !== data.accountEntity &&
            trade.buyer?.entity !== data.accountEntity
        );
        setMyTrades(myTrades);
        setTrades(trades);
      };

      /////////////////
      // ACTIONS

      const createTrade = (buyItem: Item, buyAmt: number, sellItem: Item, sellAmt: number) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Create Order',
          params: [],
          description: `Creating Order`,
          execute: async () => {
            return api.player.account.trade.create(
              [buyItem.index],
              [buyAmt],
              [sellItem.index],
              [sellAmt],
              0
            );
          },
        });
        return actionID;
      };

      const executeTrade = (tradeId: BigNumberish) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Executing Order',
          params: [tradeId],
          description: `Executing Order`,
          execute: async () => {
            return api.player.account.trade.execute(tradeId);
          },
        });
        return actionID;
      };

      const cancelTrade = (tradeId: BigNumberish) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Cancel Order',
          params: [tradeId],
          description: `Canceling Order`,
          execute: async () => {
            return api.player.account.trade.cancel(tradeId);
          },
        });
        return actionID;
      };

      return (
        <ModalWrapper id='trading' header={<ModalHeader title='Trade' />} canExit noPadding>
          <Tabs tab={tab} setTab={setTab} />
          <Content>
            <OrderbookTab
              isVisible={tab === `Orderbook`}
              actions={{ cancelTrade, executeTrade }}
              controls={{ tab }}
              data={{ ...data, trades }}
            />
            <Management
              isVisible={tab === `Management`}
              actions={{ cancelTrade, createTrade, executeTrade }}
              data={{ currencies, inventories, items, musuBalance, trades: myTrades }}
              types={types}
              utils={utils}
            />
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  height: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  overflow-x: hidden;
  overflow-y: auto;
`;
