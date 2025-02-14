import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { Auction, getAuctionByIndex } from 'app/cache/auction';
import { getConfigValue } from 'app/cache/config';
import { Inventory, getInventoryBalance } from 'app/cache/inventory';
import { Item, getItemByIndex } from 'app/cache/item';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useNetwork, useVisibility } from 'app/stores';
import { GACHA_TICKET_INDEX, MUSU_INDEX, REROLL_TICKET_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { NullAuction } from 'network/shapes/Auction';
import { Commit, filterRevealableCommits } from 'network/shapes/Commit';
import { GACHA_ID, calcRerollCost, getGachaCommits } from 'network/shapes/Gacha';
import { BaseKami, GachaKami, Kami, getGachaKami, queryKamis } from 'network/shapes/Kami';
import { playVend } from 'utils/sounds';
import { Display } from './display/Display';
import { Sidebar } from './sidebar/Sidebar';
import { AuctionMode, DefaultSorts, Filter, MYSTERY_KAMI_GIF, Sort, TabType } from './types';

// TODO: rely on cache for these instead
const kamiCache = new Map<EntityIndex, GachaKami>();
const kamiBlockCache = new Map<EntityIndex, JSX.Element>();

export function registerGachaModal() {
  registerUIComponent(
    'Gacha',
    {
      colStart: 11,
      colEnd: 89,
      rowStart: 8,
      rowEnd: 85,
    },
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const accountEntity = queryAccountFromEmbedded(network);
          const accountID = world.entities[accountEntity];
          const accountOptions = { inventories: 2, live: 2 };
          const auctionOptions = { items: 3600, balance: 1 };
          const kamiOptions = { live: 0, rerolls: 0 };

          // TODO: boot the poolKamis query to MainDisplay once we consolidate tab views under it
          return {
            network,
            data: {
              accountEntity,
              commits: getGachaCommits(world, components, accountID),
              maxRerolls: getConfigValue(world, components, 'GACHA_MAX_REROLLS'),
              poolKamis: queryKamis(components, { account: GACHA_ID }),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accountOptions),
              getAccountKamis: () => getAccountKamis(world, components, accountEntity, kamiOptions),
              getAuction: (itemIndex: number) =>
                getAuctionByIndex(world, components, itemIndex, auctionOptions),
              getGachaKami: (entity: EntityIndex) => getGachaKami(world, components, entity),
              getItem: (index: number) => getItemByIndex(world, components, index),
              getRerollCost: (kami: Kami) => calcRerollCost(world, components, kami),

              // not sure if we  need the below or just a generic getBalance
              getGachaBalance: (inventories: Inventory[]) =>
                getInventoryBalance(inventories, GACHA_TICKET_INDEX),
              getRerollBalance: (inventories: Inventory[]) =>
                getInventoryBalance(inventories, REROLL_TICKET_INDEX),
              getMusuBalance: (inventories: Inventory[]) =>
                getInventoryBalance(inventories, MUSU_INDEX),
            },
          };
        })
      ),
    ({ network, data, utils }) => {
      const { actions, world, api } = network;
      const { accountEntity, commits, poolKamis } = data;
      const { getAccount, getAuction } = utils;
      const { modals, setModals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();

      // modal state controls
      const [tab, setTab] = useState<TabType>('MINT');
      const [mode, setMode] = useState<AuctionMode>('GACHA');
      const [filters, setFilters] = useState<Filter[]>([]);
      const [sorts, setSorts] = useState<Sort[]>([DefaultSorts[0]]);

      const [account, setAccount] = useState<Account>(NullAccount);
      const [tick, setTick] = useState(Date.now());
      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [gachaAuction, setGachaAuction] = useState<Auction>(NullAuction);
      const [rerollAuction, setRerollAuction] = useState<Auction>(NullAuction);

      /////////////////
      // SUBSCRIPTIONS

      // ticking
      useEffect(() => {
        const tick = () => setTick(Date.now());
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      // update the data when the modal is opened
      useEffect(() => {
        if (!modals.gacha) return;
        if (tab === 'AUCTION') {
          setGachaAuction(getAuction(GACHA_TICKET_INDEX));
          setRerollAuction(getAuction(REROLL_TICKET_INDEX));
        }
        setAccount(getAccount());
      }, [modals.gacha, tab, accountEntity, tick]);

      // open the party modal when the reveal is triggered
      useEffect(() => {
        if (!waitingToReveal) return;
        setModals({ party: true });
        setWaitingToReveal(false);
      }, [waitingToReveal]);

      // reveal gacha result(s) when the number of commits changes
      // Q(jb): is it necessary to run this as an async
      useEffect(() => {
        const tx = async () => {
          const filtered = filterRevealableCommits(commits);
          if (!triedReveal && filtered.length > 0) {
            try {
              // wait to give buffer for rpc
              await new Promise((resolve) => setTimeout(resolve, 750));
              revealTx(filtered);
              setTriedReveal(true);
            } catch (e) {
              console.log('Gacha.tsx: handleMint() reveal failed', e);
            }
          }
        };

        tx();
      }, [commits]);

      /////////////////
      // ACTIONS

      // purchase an item from auction
      const auctionTx = async (item: Item, amt: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);
        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'AuctionBuy',
          params: [item.index, amt],
          description: `Buying ${amt} ${item.name} from auction`,
          execute: async () => {
            return api.auction.buy(item.index, amt);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      // get a pet from gacha with Mint20
      const mintTx = (amount: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiMint',
          params: [amount],
          description: `Minting ${amount} Kami`,
          execute: async () => {
            return api.mint.mintPet(amount);
          },
        });
        return actionID;
      };

      // reroll a pet with eth payment
      const rerollTx = (kamis: BaseKami[], price: bigint) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReroll',
          params: [kamis.map((n) => n.name)],
          description: `Rerolling ${kamis.length} Kami`,
          execute: async () => {
            return api.mint.reroll(
              kamis.map((n) => n.id),
              price
            );
          },
        });
        return actionID;
      };

      // reveal gacha result(s)
      const revealTx = async (commits: Commit[]) => {
        const toReveal = commits.map((n) => n.id);
        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReveal',
          params: commits,
          description: `Revealing ${commits.length} Gacha rolls`,
          execute: async () => {
            return api.player.mint.reveal(toReveal);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      ///////////////
      // HANDLERS

      const handleMint = async (amount: number) => {
        try {
          setWaitingToReveal(true);
          const mintActionID = mintTx(amount);
          if (!mintActionID) throw new Error('Mint reveal failed');

          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVend();
          return true;
        } catch (e) {
          console.log('Gacha: handleMint() failed', e);
        }
        return false;
      };

      const handleReroll = async (kamis: BaseKami[], price: bigint) => {
        if (kamis.length === 0) return false;
        try {
          setWaitingToReveal(true);
          const rerollActionID = rerollTx(kamis, price);
          if (!rerollActionID) throw new Error('Reroll action failed');

          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(rerollActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVend();
          return true;
        } catch (e) {
          console.log('Gacha: handleReroll() failed', e);
        }
        return false;
      };

      ///////////////
      // DISPLAY

      return (
        <ModalWrapper
          id='gacha'
          header={
            <ModalHeader
              title={`Gacha (${poolKamis.length} kamis in pool)`}
              icon={MYSTERY_KAMI_GIF}
            />
          }
          canExit
          noPadding
          overlay
        >
          <Container>
            <Display
              actions={{ reroll: handleReroll }}
              caches={{ kamis: kamiCache, kamiBlocks: kamiBlockCache }}
              controls={{ filters, sorts }}
              data={{
                ...data,
                balance: 0n,
                auctions: { gacha: gachaAuction, reroll: rerollAuction },
              }}
              state={{ tab, mode, setMode }}
              utils={utils}
            />
            <Sidebar
              actions={{
                bid: auctionTx,
                mint: handleMint,
                reroll: handleReroll,
                reveal: revealTx,
              }}
              controls={{ filters, setFilters, sorts, setSorts }}
              data={{
                ...data,
                inventories: account.inventories ?? [],
                auctions: { gacha: gachaAuction, reroll: rerollAuction },
              }}
              state={{ tick, tab, setTab, mode, setMode }}
              utils={utils}
            />
          </Container>
        </ModalWrapper>
      );
    }
  );
}

const Container = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: row;
`;
