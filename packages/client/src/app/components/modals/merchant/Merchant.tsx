import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { getAccount } from 'app/cache/account';
import { getInventoryBalance } from 'app/cache/inventory';
import { cleanNPCListings, getNPCByIndex, NPC, NullNPC, refreshNPCListings } from 'app/cache/npc';
import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { MUSU_INDEX } from 'constants/items';
import { Account, NullAccount, queryAccountFromEmbedded } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Inventory';
import { Listing } from 'network/shapes/Listing';
import { Cart } from './cart';
import { Catalog } from './catalog';
import { Header } from './header';
import { CartItem } from './types';

// merchant window with listings. assumes at most 1 merchant per room
export function registerMerchantModal() {
  registerUIComponent(
    'MerchantWindow',

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
          const { components, world } = network;
          const accountEntity = queryAccountFromEmbedded(network);

          return {
            data: { accountEntity },
            utils: {
              getAccount: () =>
                getAccount(world, components, accountEntity, { live: 2, inventory: 10 }),
              getNPC: (index: number) => getNPCByIndex(world, components, index, { listings: 60 }),
              cleanListings: (listings: Listing[], account: Account) =>
                cleanNPCListings(world, components, listings, account),
              refreshListings: (npc: NPC) => refreshNPCListings(components, npc),
              getMusuBalance: (inventories: Inventory[]) =>
                getInventoryBalance(inventories, MUSU_INDEX),
            },
            network,
          };
        })
      ),

    // Render
    ({ data, utils, network }) => {
      const { accountEntity } = data;
      const { getAccount, getNPC, cleanListings, refreshListings, getMusuBalance } = utils;
      const { actions, api } = network;
      const { npcIndex } = useSelected();
      const { modals } = useVisibility();

      const [account, setAccount] = useState<Account>(NullAccount);
      const [merchant, setMerchant] = useState<NPC>(NullNPC);
      const [listings, setListings] = useState<Listing[]>([]);
      const [cart, setCart] = useState<CartItem[]>([]);
      const [lastTick, setLastTick] = useState(Date.now());
      const [musuBalance, setMusuBalance] = useState<number>(0);

      // ticking
      useEffect(() => {
        const refreshClock = () => setLastTick(Date.now());
        const timerID = setInterval(refreshClock, 1000);
        return () => clearInterval(timerID);
      }, []);

      // update the listings on each tick
      useEffect(() => {
        if (!modals.merchant || npcIndex != merchant.index) return;
        setMusuBalance(getMusuBalance(account.inventories ?? []));
        refreshListings(merchant);
      }, [lastTick]);

      // update the account whenever the entity cahnges
      useEffect(() => {
        const account = getAccount();
        setAccount(account);
      }, [accountEntity]);

      // updates from selected Merchant updates
      useEffect(() => {
        if (!modals.merchant || npcIndex == merchant.index) return;
        const newMerchant = getNPC(npcIndex) ?? NullNPC;
        setMerchant(newMerchant);
        setListings(cleanListings(newMerchant.listings, account));
      }, [modals.merchant, npcIndex, account]);

      // buy from a listing
      const buy = (cart: CartItem[]) => {
        const indices = cart.map((c) => c.listing.item.index);
        const amts = cart.map((c) => c.quantity);

        actions.add({
          action: 'ListingBuy',
          params: [npcIndex, indices, amts],
          description: `Purchasing from ${merchant.name}`,
          execute: async () => {
            return api.player.npc.listing.buy(npcIndex, indices, amts);
          },
        });
      };

      /////////////////
      // DISPLAY

      if (!merchant) return <></>;
      return (
        <ModalWrapper id='merchant' canExit overlay>
          <Header merchant={merchant} player={account} balance={musuBalance} />
          <Body>
            <Catalog listings={listings} cart={cart} setCart={setCart} />
            <Cart account={account} cart={cart} setCart={setCart} buy={buy} />
          </Body>
        </ModalWrapper>
      );
    }
  );
}

const Body = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  margin: 0 1.2vw 1.2vw 1.2vw;
  min-height: 70%;
  user-select: none;
  overflow: hidden;

  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: stretch;
  align-content: stretch;
`;
