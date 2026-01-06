import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Listing } from 'network/shapes/Listing';
import { DetailedEntity } from 'network/shapes/utils';
import { CartItem } from '../types';
import { CatalogRow } from './CatalogRow';

export const Catalog = ({
  account,
  listings,
  cart,
  setCart,
  utils,
}: {
  account: Account;
  listings: Listing[];
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  utils: {
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    displayRequirements: (item: Item) => string;
  };
}) => {

  const toggleListing = (itemIndex: number) => {
    const newCart = [...cart];
    const cartIndex = cart.find((c) => c.listing.item.index === itemIndex);
    const listingIndex = listings.findIndex((l) => l.item.index === itemIndex);

    if (cartIndex) newCart.splice(newCart.indexOf(cartIndex), 1);
    else newCart.push({ listing: listings[listingIndex], quantity: 1 });
    setCart(newCart);
  };

  return (
    <Container>
      <Title>Catalog</Title>
      <Items>
        {listings.map((l) => (
          <CatalogRow
            key={l.entity}
            account={account}
            listing={l}
            cart={cart}
            toggle={() => toggleListing(l.item.index)}
            utils={utils}
          />
        ))}
      </Items>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: solid black 0.15vw;
  width: 65%;

  display: flex;
  flex-flow: column nowrap;
  flex-grow: 2;
`;

const Title = styled.div`
  position: absolute;
  background-color: rgba(92, 83, 86, 0.9);
  border-radius: 0.25vw 0 0 0;
  width: 100%;
  padding: 1.2vw;

  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Items = styled.div`
  padding: 0.9vw;
  padding-top: 4.2vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-color: transparent transparent;
`;
