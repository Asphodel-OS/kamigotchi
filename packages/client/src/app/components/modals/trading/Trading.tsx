import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccountInventories } from 'app/cache/account';
import { getTrade } from 'app/cache/trade';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllItems, getMusuBalance } from 'network/shapes/Item';
import { queryTrades } from 'network/shapes/Trade';
import { Trade } from 'network/shapes/Trade/types';
import { ManagementTab } from './management/ManagementTab';
import { OrderbookTab } from './orderbook';
import { Tabs } from './Tabs';
import { TabType } from './types';

export function registerTradingModal() {
  registerUIComponent(
    'TradingModal',
    // Grid Config
    {
      colStart: 33,
      colEnd: 66,
      rowStart: 3,
      rowEnd: 99,
    },
    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          return {
            network,
            data: { accountEntity },
            utils: {
              queryAccountFromEmbedded: () => queryAccountFromEmbedded(network),
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
    ({ network, utils, data }) => {
      const { actions, api } = network;
      const { getTrade, queryTrades } = utils;
      const { modals, setModals } = useVisibility();

      const [trades, setTrades] = useState<Trade[]>([]);
      const [tab, setTab] = useState<TabType>('Orderbook');

      useEffect(() => {
        if (!modals.trading) return;
        setTimeout(() => {
          setTrades(queryTrades().map((entity: EntityIndex) => getTrade(entity)));
        }, 5000);
      });

      useEffect(() => {
        if (modals.trading) {
          setTrades(queryTrades().map((entity: EntityIndex) => getTrade(entity)));
          setModals({ node: false, crafting: false, chat: false });
        }
      }, [modals.trading]);

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
          action: 'create trade',
          params: [],
          description: `creating Trade `,
          execute: async () => {
            return api.player.trade.create([buyIndices], [buyAmts], [sellIndices], [sellAmts], 0);
          },
        });
        return actionID;
      };

      const executeTrade = (tradeId: BigNumberish) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'create trade',
          params: [tradeId],
          description: `creating Trade `,
          execute: async () => {
            return api.player.trade.execute(tradeId);
          },
        });
        return actionID;
      };

      const cancelTrade = (tradeId: BigNumberish) => {
        const actionID = uuid() as EntityID;
        actions.add({
          action: 'cancel trade',
          params: [tradeId],
          description: `canceling Trade `,
          execute: async () => {
            return api.player.trade.cancel(tradeId);
          },
        });
        return actionID;
      };

      return (
        <ModalWrapper id='trading' header={<Header style={{}}>Trade</Header>} canExit>
          <Tabs tab={tab} setTab={setTab} />
          <Content>
            <OrderbookTab
              isVisible={tab === `Orderbook`}
              actions={{
                executeTrade,
                cancelTrade,
                createTrade,
              }}
              controls={{ tab }}
              data={{ ...data, trades }}
            />
            <ManagementTab
              isVisible={tab === `Management`}
              network={network}
              actions={{
                executeTrade,
                cancelTrade,
                createTrade,
              }}
              data={{ ...data, trades }}
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
