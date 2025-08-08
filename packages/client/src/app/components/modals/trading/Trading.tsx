import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount, getAccountByID } from 'app/cache/account';
import { getItem, getItemByIndex } from 'app/cache/item';
import { getTrade, getTradeHistory } from 'app/cache/trade';
import { ModalHeader, ModalWrapper, Overlay } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useNetwork, useVisibility } from 'app/stores';
import { getKamidenClient } from 'clients/kamiden';
import { Trade as TradeHistory, TradesRequest } from 'clients/kamiden/proto';
import { ETH_INDEX, MUSU_INDEX, ONYX_INDEX } from 'constants/items';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllItems, getMusuBalance, Item } from 'network/shapes/Item';
import { queryTrades } from 'network/shapes/Trade';
import { Trade } from 'network/shapes/Trade/types';
import { History } from './history/History';
import { Confirmation, ConfirmationData } from './library/Confirmation';
import { Tabs } from './library/Tabs';
import { Management } from './management';
import { Orderbook } from './orderbook';
import { TabType } from './types';

const SYNC_TIME = 1000;
const CurrencyIndices = [MUSU_INDEX, ETH_INDEX, ONYX_INDEX];
const KamidenClient = getKamidenClient();

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
          const { world, components: comps, actions } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const accountOptions = { live: 1, config: 3600 };
          const tradeOptions = { state: 2, taker: 2 };

          return {
            network,
            data: {
              account: getAccount(world, comps, accountEntity, accountOptions),
            },
            types: {
              ActionComp: actions.Action,
            },
            utils: {
              entityToIndex: (id: EntityID) => world.entityToIndex.get(id)!,
              getAllItems: () => getAllItems(world, comps),
              getAccount: () => getAccount(world, comps, accountEntity, accountOptions),
              getTrade: (entity: EntityIndex) => getTrade(world, comps, entity, tradeOptions),
              queryTrades: () => queryTrades(comps),
              getItemByIndex: (index: number) => getItemByIndex(world, comps, index),
              getMusuBalance: () => getMusuBalance(world, comps, accountEntity),
              getItem: (entity: EntityIndex) => getItem(world, comps, entity),
              getAccountByID: (id: EntityID) => getAccountByID(world, comps, id, accountOptions),
              getTradeHistory: (tradeHistory: TradeHistory) =>
                getTradeHistory(world, comps, tradeHistory),
            },
          };
        })
      ),

    // Render
    ({ network, data, types, utils }) => {
      const { actions } = network;
      const { account } = data;
      const { getAllItems, getTrade, queryTrades } = utils;
      const { modals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();

      const [items, setItems] = useState<Item[]>([]);
      const [currencies, setCurrencies] = useState<Item[]>([]);
      const [trades, setTrades] = useState<Trade[]>([]);
      const [myTrades, setMyTrades] = useState<Trade[]>([]);

      const [tab, setTab] = useState<TabType>('Orderbook');
      const [tick, setTick] = useState(Date.now());
      const [isConfirming, setIsConfirming] = useState(false);
      const [confirmData, setConfirmData] = useState<ConfirmationData>({
        content: <></>,
        onConfirm: () => null,
      });
      const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);

      // time trigger to use for periodic refreshes
      useEffect(() => {
        refreshItemRegistry();

        const updateSync = () => setTick(Date.now());
        const timerId = setInterval(updateSync, SYNC_TIME);
        return () => clearInterval(timerId);
      }, []);

      // sets trades upon opening modal
      useEffect(() => {
        if (!modals.trading) return;
        refreshTrades();
        getTradeHistoryKamiden(account.id);
      }, [modals.trading, tick]);

      /////////////////
      // GETTERS

      // pull all items from the registry and save the tradable ones
      const refreshItemRegistry = () => {
        const all = getAllItems();
        // const nonCurrencies = all.filter((item) => !CurrencyIndices.includes(item.index));
        const tradable = all.filter((item) => item.is.tradeable);
        tradable.sort((a, b) => (a.name > b.name ? 1 : -1));
        if (tradable.length !== items.length) setItems(tradable);

        setCurrencies([all.find((item) => item.index === 1)!]);
      };

      // pull all open trades and partition them based on whether created by the player
      // NOTE: filtering by Taker not yet implemented
      const refreshTrades = () => {
        const allTrades = queryTrades().map((entity: EntityIndex) => getTrade(entity));
        const myTrades = allTrades.filter((trade) => {
          const isMaker = trade.maker?.entity === account.entity;
          const isTaker = trade.taker?.entity === account.entity;
          return isMaker || isTaker;
        });
        const trades = allTrades.filter((trade) => {
          const isNotMaker = trade.maker?.entity !== account.entity;
          const isNotTaker = trade.taker?.entity !== account.entity;
          const isOpen = trade.state === 'PENDING';
          return isNotMaker && isNotTaker && isOpen;
        });
        setMyTrades(myTrades);
        setTrades(trades);
      };

      async function getTradeHistoryKamiden(accountId: string) {
        const parsedAccountId = BigInt(accountId).toString();
        try {
          const request: TradesRequest = {
            AccountId: parsedAccountId,
            Timestamp: '0',
          };
          const response = await KamidenClient?.getTradeHistory(request);
          setTradeHistory(response?.Trades || []);
        } catch (error) {
          console.error('Error getting trade history :', error);
          throw error;
        }
      }

      /////////////////
      // ACTIONS

      // create a trade offer based on any two sets of items and amounts
      const createTrade = (
        wantItems: Item[],
        wantAmts: number[],
        haveItems: Item[],
        haveAmts: number[]
      ) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const wantIndices = wantItems.map((item) => item.index);
        const haveIndices = haveItems.map((item) => item.index);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Create Order',
          params: [],
          description: `Creating Order`,
          execute: async () => {
            return api.account.trade.create(wantIndices, wantAmts, haveIndices, haveAmts, 0);
          },
        });
        return actionID;
      };

      // execute an open trade offer
      const executeTrade = (trade: Trade) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Executing Order',
          params: [trade.id],
          description: `Executing Order`,
          execute: async () => {
            return api.account.trade.execute(trade.id);
          },
        });
        return actionID;
      };

      // complete an executed trade offer
      const completeTrade = (trade: Trade) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Complete Order',
          params: [trade.id],
          description: `Completing Order`,
          execute: async () => {
            return api.account.trade.complete(trade.id);
          },
        });
        return actionID;
      };

      // cancel an existing trade offer
      const cancelTrade = (trade: Trade) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          action: 'Cancel Order',
          params: [trade.id],
          description: `Canceling Order`,
          execute: async () => {
            return api.account.trade.cancel(trade.id);
          },
        });
        return actionID;
      };

      return (
        <ModalWrapper id='trading' header={<ModalHeader title='Trade' />} canExit noPadding overlay>
          <Overlay fullHeight fullWidth passthrough>
            <Confirmation
              title={confirmData.title}
              subTitle={confirmData.subTitle}
              controls={{ isOpen: isConfirming, close: () => setIsConfirming(false) }}
              onConfirm={confirmData.onConfirm}
            >
              {confirmData.content}
            </Confirmation>
          </Overlay>
          <Tabs tab={tab} setTab={setTab} />
          <Content>
            <Orderbook
              actions={{ cancelTrade, executeTrade }}
              controls={{ tab, setConfirmData, isConfirming, setIsConfirming }}
              data={{ account, items, trades }}
              isVisible={tab === `Orderbook`}
              utils={utils}
            />
            <Management
              actions={{ cancelTrade, completeTrade, createTrade, executeTrade }}
              controls={{ tab, setConfirmData, isConfirming, setIsConfirming }}
              data={{
                account,
                currencies,
                inventory: account.inventories ?? [],
                items,
                trades: myTrades,
              }}
              types={types}
              utils={utils}
              isVisible={tab === `Management`}
            />
            <History
              data={{
                account,
                currencies,
                tradeHistory,
              }}
              utils={utils}
              isVisible={tab === `History`}
            />
          </Content>
        </ModalWrapper>
      );
    }
  );
}

const Content = styled.div`
  position: relative;
  gap: 0.6vw;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  overflow-x: hidden;
  overflow-y: auto;
`;
