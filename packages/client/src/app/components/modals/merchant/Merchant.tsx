import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Merchant, getMerchantByIndex } from 'network/shapes/Npc/Merchant';
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
      colStart: 21,
      colEnd: 81,
      rowStart: 15,
      rowEnd: 88,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { components, world } = network;
          const account = getAccountFromBurner(network, { inventory: true });
          const getMerchant = (npcIndex: number) => getMerchantByIndex(world, components, npcIndex);
          return {
            data: { account },
            functions: { getMerchant },
            network,
          };
        })
      ),

    // Render
    ({ data, functions, network }) => {
      // console.log('mMerchant: data', data);
      const { account } = data;
      const { getMerchant } = functions;
      const { actions, api } = network;
      const { npcIndex } = useSelected();
      const [merchant, setMerchant] = useState<Merchant>(getMerchant(npcIndex));
      const [cart, setCart] = useState<CartItem[]>([]);

      // updates from selected Merchant updates
      useEffect(() => {
        setMerchant(getMerchant(npcIndex));
      }, [npcIndex]);

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
            <Catalog listings={merchant.listings} cart={cart} setCart={setCart} />
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

  display: flex;
  flex-flow: row nowrap;
  justify-content: stretch;
  align-items: stretch;
  align-content: stretch;
`;
