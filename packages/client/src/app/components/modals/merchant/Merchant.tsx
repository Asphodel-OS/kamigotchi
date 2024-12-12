import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected, useVisibility } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Listing, getNPCListingsFiltered } from 'network/shapes/Listings';
import { NPC, NullNPC, getNPCByIndex } from 'network/shapes/NPCs';
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

          const account = getAccountFromBurner(network, { inventory: true });
          const getNPC = (npcIndex: number) => getNPCByIndex(world, components, npcIndex);
          const getListings = (npcIndex: number) =>
            getNPCListingsFiltered(world, components, npcIndex, account);

          return {
            data: { account },
            utils: { getNPC, getListings },
            network,
          };
        })
      ),

    // Render
    ({ data, utils, network }) => {
      const { account } = data;
      const { getNPC, getListings } = utils;
      const { actions, api } = network;
      const { npcIndex } = useSelected();
      const { modals } = useVisibility();

      const [merchant, setMerchant] = useState<NPC>(NullNPC);
      const [listings, setListings] = useState<Listing[]>([]);
      const [cart, setCart] = useState<CartItem[]>([]);

      // updates from selected Merchant updates
      useEffect(() => {
        if (!modals.merchant || npcIndex == merchant.index) return;
        const newMerchant = getNPC(npcIndex) ?? NullNPC;
        setMerchant(newMerchant);
        setListings(getListings(npcIndex));
      }, [modals.merchant, npcIndex]);

      // buy from a listing
      const buy = (cart: CartItem[]) => {
        const indices = cart.map((c) => c.listing.item.index);
        const amts = cart.map((c) => c.quantity);

        actions.add({
          action: 'ListingBuy',
          params: [npcIndex, indices, amts],
          description: `Purchasing from ${merchant.name}`,
          execute: async () => {
            return api.player.listing.buy(npcIndex, indices, amts);
          },
        });
      };

      /////////////////
      // DISPLAY

      if (!merchant) return <></>;
      return (
        <ModalWrapper id='merchant' canExit overlay>
          <Header merchant={merchant} player={account} />
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
