import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { Listing } from 'network/shapes/Listing';
import { CartItem } from '../types';
import { CatalogRow } from './CatalogRow';

export const Catalog = ({
  account,
  listings,
  cart,
  setCart,
}: {
  account: Account;
  listings: Listing[];
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
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
          />
        ))}
      </Items>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: solid black 0.15em;
  width: 65%;

  display: flex;
  flex-flow: column nowrap;
  flex-grow: 2;
`;

const Title = styled.div`
  position: absolute;
  background-color: rgba(92, 83, 86, 0.9);
  border-radius: 0.25em 0 0 0;
  width: 100%;
  padding: 1.2em;

  color: black;
  font-size: 1.2em;
  text-align: left;
  z-index: 1;
`;

const Items = styled.div`
  padding: 0.9em;
  padding-top: 4.2em;
  gap: 0.6em;

  display: flex;
  flex-flow: column nowrap;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  scrollbar-color: transparent transparent;
`;
