import { EntityID, EntityIndex } from '@mud-classic/recs';
import { uuid } from '@mud-classic/utils';
import { BigNumberish } from 'ethers';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccountInventories } from 'app/cache/account';
import { getTrade } from 'app/cache/trade';
import { ModalWrapper, Popover } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getAllItems, getMusuBalance } from 'network/shapes/Item';
import { queryTrades } from 'network/shapes/Trade';
import { Trade } from 'network/shapes/Trade/types';
import { ActiveOffers } from './ActiveOffers';
import { ManagementTab } from './ManagementTab';
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

      const [search, setSearch] = useState<string>('');
      const [filter, setFilter] = useState<string>('Price \u0245');
      const [ascending, setAscending] = useState<boolean>(true);
      const [trades, setTrades] = useState<Trade[]>([]);
      const [tab, setTab] = useState<TabType>('ActiveOffers');

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

      const options = [
        {
          text: filter === 'Price \u0245' ? 'Price v' : 'Price \u0245',
          onClick: () => {
            if (filter === 'Price \u0245') {
              setFilter('Price v');
              setAscending(false);
            } else {
              setFilter('Price \u0245');
              setAscending(true);
            }
          },
        },
      ];

      const OptionsMap = () => {
        return options.map((option, i) => (
          <PopOverButton key={`div-${i}`} onClick={option.onClick}>
            {option.text}
          </PopOverButton>
        ));
      };

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
            <ActiveOffersDiv isVisible={tab === `ActiveOffers`}>
              <Row>
                <Label>
                  SEARCH
                  <Search
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Search and item...'
                  />
                </Label>
                <Label>
                  SORT BY
                  <Popover closeOnClick={true} content={OptionsMap()}>
                    <Sort>{filter} </Sort>
                  </Popover>
                </Label>
              </Row>
              <ActiveOffers
                actions={{
                  executeTrade,
                  cancelTrade,
                }}
                data={{ ...data, trades }}
                controls={{ ascending, search }}
                managementTab={false}
              />
            </ActiveOffersDiv>
            <ManagementTab
              isVisible={tab === `ManagementTab`}
              network={network}
              actions={{
                executeTrade,
                cancelTrade,
                createTrade,
              }}
              controls={{ ascending, search }}
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

const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
`;

const Label = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1vw;
  position: relative;
  width: 49%;
`;

const Search = styled.input`
  border-radius: 0.6vw;
  border: 0.15vw solid black;
  margin: 4% 0 0 0;
  min-height: 3vw;
  background: url(${ActionIcons.search}) no-repeat left center;
  background-origin: content-box;
  padding: 0.5vw 1vw;
  background-size: contain;
  text-align: center;
  font-size: 0.8vw;
  &::placeholder {
    position: absolute;
    left: 20%;
    background-color: white;
  }
`;

const Sort = styled.button`
  display: flex;
  border-radius: 0.6vw;
  border: 0.15vw solid black;

  margin: 4% 0 0 0;
  min-height: 3vw;
  width: 100%;
  font-size: 1vw;
  align-items: center;
  padding-left: 1vw;
  background-color: white;
`;

const PopOverButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.4vw;
  font-size: 1vw;
  width: 19vw;
  border-color: transparent;
  background-color: white;
  &:hover {
    filter: brightness(0.8);
    cursor: pointer;
  }
`;

const ActiveOffersDiv = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
`;
