import { EntityID, EntityIndex } from '@mud-classic/recs';
import { registerUIComponent } from 'app/root';
import { waitForActionCompletion } from 'network/utils';
import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { getAccount, getAccountKamis } from 'app/cache/account';
import { Auction, getAuctionByIndex } from 'app/cache/auction';
import { getGachaMintConfig } from 'app/cache/config';
import { Inventory, getInventoryBalance } from 'app/cache/inventory';
import { Item, getItemByIndex } from 'app/cache/item';
import { getKami } from 'app/cache/kami';
import { ModalHeader, ModalWrapper } from 'app/components/library';
import { useNetwork, useVisibility } from 'app/stores';
import { GACHA_ID } from 'constants/gacha';
import { GACHA_TICKET_INDEX, REROLL_TICKET_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { NullAuction } from 'network/shapes/Auction';
import { Commit, filterRevealableCommits } from 'network/shapes/Commit';
import { hasFlag } from 'network/shapes/Flag';
import { getGachaCommits } from 'network/shapes/Gacha';
import { getMintData } from 'network/shapes/Gacha/mint';
import { Kami, queryKamis } from 'network/shapes/Kami';
import { getCompAddr } from 'network/shapes/utils';
import { playVend } from 'utils/sounds';
import { Display } from './display/Display';
import { Sidebar } from './sidebar/Sidebar';
import { DefaultSorts, Filter, MYSTERY_KAMI_GIF, Sort, TabType, ViewMode } from './types';

// TODO: rely on cache for these instead
const KamiBlockCache = new Map<EntityIndex, JSX.Element>();

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
          const kamiOptions = { live: 0, progress: 3600, stats: 3600, traits: 3600 };

          // TODO: boot the poolKamis query to MainDisplay once we consolidate tab views under it
          return {
            network,
            data: {
              accountEntity,
              commits: getGachaCommits(world, components, accountID),
              poolKamis: queryKamis(components, { account: GACHA_ID }),
            },
            tokens: {
              spenderAddr: getCompAddr(world, components, 'component.token.allowance'),
            },
            utils: {
              getAccount: () => getAccount(world, components, accountEntity, accountOptions),
              getAccountKamis: () => getAccountKamis(world, components, accountEntity, kamiOptions),
              getAuction: (itemIndex: number) =>
                getAuctionByIndex(world, components, itemIndex, auctionOptions),
              getItem: (index: number) => getItemByIndex(world, components, index),
              getItemBalance: (inventories: Inventory[], index: number) =>
                getInventoryBalance(inventories, index),
              getKami: (entity: EntityIndex) =>
                getKami(world, components, entity, kamiOptions, false),
              getMintConfig: () => getGachaMintConfig(world, components),
              getMintData: (accountID: EntityID) => getMintData(world, components, accountID),
              isWhitelisted: (entity: EntityIndex) =>
                hasFlag(world, components, entity, 'MINT_WHITELISTED'),
            },
          };
        })
      ),
    ({ network, data, tokens, utils }) => {
      const { actions, world, api } = network;
      const { accountEntity, commits, poolKamis } = data;
      const { spenderAddr } = tokens;
      const { getAccount, getAuction, getItem, getItemBalance } = utils;
      const { modals, setModals } = useVisibility();
      const { selectedAddress, apis } = useNetwork();

      // modal controls
      const [tab, setTab] = useState<TabType>('GACHA');
      const [mode, setMode] = useState<ViewMode>('DEFAULT');
      const [filters, setFilters] = useState<Filter[]>([]);
      const [sorts, setSorts] = useState<Sort[]>([DefaultSorts[0]]);

      // modal state
      const [quantity, setQuantity] = useState(0);
      const [selectedKamis, setSelectedKamis] = useState<Kami[]>([]);
      const [tick, setTick] = useState(Date.now());

      const [account, setAccount] = useState<Account>(NullAccount);
      const [triedReveal, setTriedReveal] = useState(true);
      const [waitingToReveal, setWaitingToReveal] = useState(false);
      const [gachaAuction, setGachaAuction] = useState<Auction>(NullAuction);
      const [rerollAuction, setRerollAuction] = useState<Auction>(NullAuction);

      /////////////////
      // SUBSCRIPTIONS

      // ticking
      useEffect(() => {
        setAccount(getAccount());

        const tick = () => setTick(Date.now());
        const timerID = setInterval(tick, 1000);
        return () => clearInterval(timerID);
      }, []);

      // update the data when the modal is open
      useEffect(() => {
        if (!modals.gacha) return;
        if (mode === 'ALT') {
          if (tab === 'GACHA') setGachaAuction(getAuction(GACHA_TICKET_INDEX));
          else if (tab === 'REROLL') setRerollAuction(getAuction(REROLL_TICKET_INDEX));
        }
        setAccount(getAccount());
      }, [modals.gacha, tab, mode, accountEntity, tick]);

      // open the party modal when the reveal is triggered
      useEffect(() => {
        if (!waitingToReveal) return;
        setModals({ party: true });
        setWaitingToReveal(false);
      }, [waitingToReveal]);

      // reveal gacha result(s) when the number of commits changes
      // Q(jb): is it necessary to run this as an async
      // We should pass over a function for
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
              console.log('Gacha.tsx: handlePull() reveal failed', e);
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

      // approve the spend of an ERC20 token
      const approveTx = async (payItem: Item, price: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions.add({
          id: actionID,
          action: 'Approve token',
          params: [payItem.address, spenderAddr, price],
          description: `Approve ${price} ${payItem.name} to be spent`,
          execute: async () => {
            return api.erc20.approve(payItem.address!, spenderAddr, price);
          },
        });
      };

      // mint a Gacha Ticket from the WL Mint
      const mintWLTx = () => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'GachaMintWL',
          params: [],
          description: `Acquiring Gacha Ticket from the WL Mint`,
          execute: async () => {
            return api.gacha.tickets.buy.whitelist();
          },
        });
        return actionID;
      };

      // mint a Gacha Ticket from the Public Mint
      const mintPublicTx = (amount: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'GachaMintPublic',
          params: [amount],
          description: `Acquiring ${amount} Gacha Tickets from the Public Mint`,
          execute: async () => {
            return api.gacha.tickets.buy.public(amount);
          },
        });
        return actionID;
      };

      // pull a pet from gacha with a Gacha Ticket
      const pullTx = (amount: number) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiMint',
          params: [amount],
          description: `Minting ${amount} Kami`,
          execute: async () => {
            return api.gacha.pet.mint(amount);
          },
        });
        return actionID;
      };

      // reroll a pet with a Reroll Ticket
      const rerollTx = (kamis: Kami[]) => {
        const api = apis.get(selectedAddress);
        if (!api) return console.error(`API not established for ${selectedAddress}`);

        const actionID = uuid() as EntityID;
        actions!.add({
          id: actionID,
          action: 'KamiReroll',
          params: [kamis.map((n) => n.name)],
          description: `Rerolling ${kamis.length} Kami`,
          execute: async () => {
            return api.gacha.pet.reroll(kamis.map((n) => n.id));
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
            return api.player.gacha.pet.reveal(toReveal);
          },
        });

        await waitForActionCompletion(
          actions!.Action,
          world.entityToIndex.get(actionID) as EntityIndex
        );
      };

      ///////////////
      // HANDLERS

      // reset mode and quantity on tab change
      const handleSetTab = (tab: TabType) => {
        setTab(tab);
        setMode('DEFAULT');
        setQuantity(0);
      };

      // reset quantity on mode change
      const handleSetMode = (mode: ViewMode) => {
        setMode(mode);
        setQuantity(0);
      };

      const handlePull = async (amount: number) => {
        try {
          setWaitingToReveal(true);
          const mintActionID = pullTx(amount);
          if (!mintActionID) throw new Error('Mint reveal failed');

          await waitForActionCompletion(
            actions!.Action,
            world.entityToIndex.get(mintActionID) as EntityIndex
          );
          setTriedReveal(false);
          playVend();
          return true;
        } catch (e) {
          console.log('Gacha: handlePull() failed', e);
        }
        return false;
      };

      const handleReroll = async (kamis: Kami[]) => {
        if (kamis.length === 0) return false;
        try {
          setWaitingToReveal(true);
          const rerollActionID = rerollTx(kamis);
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
              caches={{ kamiBlocks: KamiBlockCache }}
              controls={{ mode, setMode: handleSetMode, tab, filters, sorts }}
              data={{
                ...data,
                account,
                auctions: { gacha: gachaAuction, reroll: rerollAuction },
              }}
              state={{ setQuantity, selectedKamis, setSelectedKamis, tick }}
              utils={utils}
            />
            <Sidebar
              actions={{
                approve: approveTx,
                bid: auctionTx,
                mintPublic: mintPublicTx,
                mintWL: mintWLTx,
                pull: handlePull,
                reroll: handleReroll,
                reveal: revealTx,
              }}
              controls={{
                mode,
                setMode: handleSetMode,
                tab,
                setTab: handleSetTab,
                filters,
                setFilters,
                sorts,
                setSorts,
              }}
              data={{
                ...data,
                inventories: account.inventories ?? [],
                auctions: { gacha: gachaAuction, reroll: rerollAuction },
              }}
              state={{
                quantity,
                setQuantity,
                selectedKamis,
                setSelectedKamis,
                tick,
              }}
              utils={{
                getItem,
                getItemBalance: (index: number) => getItemBalance(account.inventories ?? [], index),
              }}
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
