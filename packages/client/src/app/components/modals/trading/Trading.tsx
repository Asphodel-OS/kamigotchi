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
import { getAllItems, getMusuBalance } from 'network/shapes/Item';
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
              getTrade: (entity: EntityIndex) => getTrade(world, components, entity),
              queryTrades: () => queryTrades(components),
              getInventories: () => getAccountInventories(world, components, accountEntity),
              getAllItems: () => getAllItems(world, components),
              getMusuBalance: () => getMusuBalance(world, components, accountEntity),
            },
          };
        })
      ),

    // Render
    ({ network, data, types, utils }) => {
      const { actions, api } = network;
      const { getTrade, queryTrades, getInventories } = utils;
      const { modals } = useVisibility();

      const [trades, setTrades] = useState<Trade[]>([]);
      const [myTrades, setMyTrades] = useState<Trade[]>([]);
      const [inventories, setInventories] = useState<Inventory[]>([]);
      const [musuBalance, setMusuBalance] = useState<number>(0);
      const [tab, setTab] = useState<TabType>('Orderbook');
      const [tick, setTick] = useState(Date.now());

      // time trigger to use for periodic refreshes
      useEffect(() => {
        const updateSync = () => setTick(Date.now());
        const timerId = setInterval(updateSync, SYNC_TIME);
        return () => clearInterval(timerId);
      }, []);

      // sets trades upon opening modal
      useEffect(() => {
        if (!modals.trading) return;

        // pull and filter trades
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

        // pull and set inventories
        const allInventories = getInventories();
        setMusuBalance(getInventoryBalance(inventories, MUSU_INDEX));
        setInventories(cleanInventories(allInventories));
      }, [modals.trading, tick]);

      /////////////////
      // ACTIONS

      const createTrade = (
        buyIndices: Number,
        buyAmts: BigNumberish,
        sellIndices: Number,
        sellAmts: BigNumberish
      ) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Create Order',
          params: [],
          description: `Creating Order`,
          execute: async () => {
            return api.player.account.trade.create(
              [buyIndices],
              [buyAmts],
              [sellIndices],
              [sellAmts],
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
              actions={{ cancelTrade, createTrade, executeTrade }}
              controls={{ tab }}
              data={{ ...data, trades }}
            />
            <Management
              isVisible={tab === `Management`}
              network={network}
              actions={{ cancelTrade, createTrade, executeTrade }}
              data={{ ...data, inventories, musuBalance, trades: myTrades }}
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
  display: flex;
  flex-flow: wrap;
  -webkit-box-pack: start;
  justify-content: flex-start;
  gap: 0.6vw;
  padding: 0.5vw;

  height: 100%;
  flex-wrap: nowrap;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  margin-top: 2vw;
`;

const Header = styled.div`
  padding: 2vw;
  font-size: 1.3vw;
`;
