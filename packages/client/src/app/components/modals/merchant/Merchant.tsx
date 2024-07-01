import { useEffect, useState } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { useSelected } from 'app/stores';
import { getAccountFromBurner } from 'network/shapes/Account';
import { Merchant, getMerchantByIndex } from 'network/shapes/Merchant';
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
      colStart: 20,
      colEnd: 80,
      rowStart: 15,
      rowEnd: 85,
    },

    // Requirement
    (layers) =>
      interval(1000).pipe(
        map(() => {
          const { network } = layers;
          const { world, components } = network;
          const account = getAccountFromBurner(network, { inventory: true });
          const getMerchant = (npcIndex: number) => getMerchantByIndex(world, components, npcIndex);
          return {
            data: { account },
            functions: { getMerchant },
          };
        })
      ),

    // Render
    ({ data, functions }) => {
      // console.log('mMerchant: data', data);
      const { getMerchant } = functions;
      const { account } = data;
      const { npcIndex } = useSelected();
      const [merchant, setMerchant] = useState<Merchant>(getMerchant(npcIndex));
      const [cart, setCart] = useState<CartItem[]>([]);

      // updates from selected Merchant updates
      useEffect(() => {
        setMerchant(getMerchant(npcIndex));
      }, [npcIndex]);

      /////////////////
      // DISPLAY

      if (!merchant) return <></>;
      return (
        <ModalWrapper id='merchant' canExit>
          <Header merchant={merchant} player={account} />
          <Body>
            <Catalog listings={merchant.listings} cart={cart} setCart={setCart} />
            <Cart account={account} cart={cart} setCart={setCart} />
          </Body>
        </ModalWrapper>
      );
    }
  );
}

const Body = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  margin: 2.4vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  height: 70%;
`;
