import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccount as _getAccount, getAccountByID as _getAccountByID } from 'app/cache/account';
import {
  getItem as _getItem,
  getItemByIndex as _getItemByIndex,
  getAllItems,
} from 'app/cache/item';
import { getTrade as _getTrade, getTradeHistory as _getTradeHistory } from 'app/cache/trade';
import { ModalHeader, ModalWrapper, Overlay } from 'app/components/library';
import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useNetwork, useSelected, useVisibility } from 'app/stores';
import { TradeIcon } from 'assets/images/icons/menu';
import { getKamidenClient } from 'clients/kamiden';
import { Trade as TradeHistory, TradesRequest } from 'clients/kamiden/proto';
import { EntityID, EntityIndex } from 'engine/recs';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { getMusuBalance as _getMusuBalance, Item } from 'network/shapes/Item';
import { queryTrades as _queryTrades } from 'network/shapes/Trade';
import { Trade } from 'network/shapes/Trade/types';
import { CURRENCIES } from './constants';
import { History } from './history/History';
import { Confirmation, ConfirmationData, EmptyConfimation } from './library/Confirmation';
import { Tabs } from './library/Tabs';
import { Management } from './management';
import { Orderbook } from './orderbook';
import { TabType } from './types';

const SYNC_TIME = 1000;
const KamidenClient = getKamidenClient();

export const TradingModal: UIComponent = {
  id: 'TradingModal',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network, data, types, utils } = (() => {
      const { network } = layers;
      const { world, components: comps, actions } = network;
      const accountEntity = queryAccountFromEmbedded(network);
      const accountOptions = { live: 1, inventory: 1, config: 3600 };
      const tradeOptions = { state: 2, taker: 2 };

      return {
        network,
        data: {
          accountEntity,
        },
        types: {
          ActionComp: actions.Action,
        },
        utils: {
          entityToIndex: (id: EntityID) => world.entityToIndex.get(id)!,
          getAccount: (entity: EntityIndex) => _getAccount(world, comps, entity, accountOptions),
          getTrade: (entity: EntityIndex) => _getTrade(world, comps, entity, tradeOptions),
          queryTrades: () => _queryTrades(comps),
          getItemByIndex: (index: number) => _getItemByIndex(world, comps, index),
          getMusuBalance: () => _getMusuBalance(world, comps, accountEntity),
          getItem: (entity: EntityIndex) => _getItem(world, comps, entity),
          getAccountByID: (id: EntityID) => _getAccountByID(world, comps, id, accountOptions),
          getTradeHistory: (history: TradeHistory) => _getTradeHistory(world, comps, history),
        },
      };
    })();

    const { actions } = network;
    const { accountEntity } = data;
    const { ActionComp } = types;
    const { getAccount, getTrade, queryTrades } = utils;

    const apis = useNetwork((s) => s.apis);
    const selectedAddress = useNetwork((s) => s.selectedAddress);
    const modalVisible = useVisibility((s) => s.modals.trading);

    const [account, setAccount] = useState<Account>(NullAccount);
    const [items, setItems] = useState<Item[]>([]);
    const [currencies, setCurrencies] = useState<Item[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [myTrades, setMyTrades] = useState<Trade[]>([]);

    const [tab, setTab] = useState<TabType>('Orderbook');
    const [tick, setTick] = useState(Date.now());
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmData, setConfirmData] = useState<ConfirmationData>(EmptyConfimation);
    const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);

    // set the item registry and ticking on mount
    useEffect(() => {
      refreshItemRegistry();
      const account = getAccount(accountEntity);
      if (account.index !== NullAccount.index) refreshTrades(account); // tends to render before account is loaded
      setAccount(account);

      const updateSync = () => setTick(Date.now());
      const timerId = setInterval(updateSync, SYNC_TIME);
      return () => clearInterval(timerId);
    }, []);

    // sets trades upon opening modal
    useEffect(() => {
      if (!modalVisible) return;
      const account = getAccount(accountEntity);
      setAccount(account);
      refreshTrades(account);
    }, [modalVisible, tick]);

    // update trade history whenever tab is checked
    useEffect(() => {
      if (!modalVisible || tab !== `History`) return;
      getTradeHistory(account.id);
    }, [tab]);

    // open account modal on events from offers
    // Q: what is this used for?
    useEffect(() => {
      const handleOpenAccountModal = (_event: Event) => {
        try {
          const { setModals } = useVisibility.getState();
          setModals({ account: true });
        } catch (error) {
          console.error('Failed to open account modal from event', error);
        }
      };

      const handleSetAccountIndex = (event: Event) => {
        try {
          if (!event) return;
          const detail = (event as CustomEvent).detail;

          let index: number | null = null;
          if (typeof detail === 'number') {
            index = detail;
          } else {
            const parsed = Number(detail);
            if (Number.isFinite(parsed)) index = parsed;
          }

          if (index === null || index < 0) return;

          const state = useSelected.getState();
          const setAccount = (state as any).setAccount;
          if (typeof setAccount === 'function') {
            setAccount(index);
          } else {
            console.error('useSelected.setAccount is not a function');
          }
        } catch (error) {
          console.error('Error handling account:setIndex event', error);
        }
      };

      window.addEventListener('modal:openAccount', handleOpenAccountModal);
      window.addEventListener('account:setIndex', handleSetAccountIndex);
      return () => {
        window.removeEventListener('modal:openAccount', handleOpenAccountModal);
        window.removeEventListener('account:setIndex', handleSetAccountIndex);
      };
    }, []);

    /////////////////
    // GETTERS

    // pull all items from the registry and save the tradable ones
    const refreshItemRegistry = () => {
      const all: Item[] = getAllItems();

      // const nonCurrencies = all.filter((item) => !CURRENCIES.includes(item.index));
      const tradable = all.filter((item) => item.is.tradeable);
      tradable.sort((a, b) => (a.name > b.name ? 1 : -1));
      if (tradable.length !== items.length) setItems(tradable);

      const currencyIndices = new Set(CURRENCIES);
      setCurrencies(all.filter((item) => currencyIndices.has(item.index)));
    };

    // pull all open trades and partition them based on whether created by the player
    // NOTE: filtering by Taker not yet implemented
    const refreshTrades = (account: Account) => {
      const tradeEntities = queryTrades();
      const allTrades = tradeEntities.map((entity: EntityIndex) => getTrade(entity));
      const myTrades = allTrades.filter((trade: Trade) => {
        const isMaker = trade.maker?.entity === account.entity;
        const isTaker = trade.taker?.entity === account.entity;
        return isMaker || isTaker;
      });
      const trades = allTrades.filter((trade: Trade) => {
        const isNotMaker = trade.maker?.entity !== account.entity;
        const isNotTaker = trade.taker?.entity !== account.entity;
        const isOpen = trade.state === 'PENDING';
        return isNotMaker && isNotTaker && isOpen;
      });
      setMyTrades(myTrades);
      setTrades(trades);
    };

    // get trade history from Kamiden
    // TODO: make this subscription based
    async function getTradeHistory(accountId: string) {
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

    /////////////////
    // RENDER

    return (
      <ModalWrapper
        id='trading'
        header={<ModalHeader title='Trade' icon={TradeIcon} />}
        canExit
        noPadding
        overlay
      >
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
        <Content className='trading-modal-content'>
          <Orderbook
            actions={{ cancelTrade, executeTrade }}
            controls={{ tab, setConfirmData, isConfirming, setIsConfirming }}
            data={{ account, items, trades }}
            utils={utils}
            isVisible={tab === `Orderbook`}
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
            types={{ ActionComp }}
            utils={{ ...utils, getAllItems }}
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
  },
};

const Content = styled.div`
  position: relative;

  flex-grow: 1;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;

  overflow-x: hidden;
  overflow-y: hidden;
  font-size: 0.9vw;
`;
