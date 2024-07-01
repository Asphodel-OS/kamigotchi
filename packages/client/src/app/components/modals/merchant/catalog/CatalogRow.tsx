import styled, { keyframes } from 'styled-components';

import { Tooltip } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Listing } from 'network/shapes/Listing';
import { playClick } from 'utils/sounds';
import { CartItem } from '../types';

export interface Props {
  cart: CartItem[];
  listing: Listing;
  toggle: () => void;
}

// TODO: support multiple buys
export const CatalogRow = (props: Props) => {
  const { listing, toggle } = props;

  const handleClick = () => {
    playClick();
    toggle();
  };

  const isInCart = props.cart.some((c) => c.listing.item.index === listing.item.index);
  return (
    <Container key={listing.item.index} isInCart={isInCart} onClick={() => handleClick()}>
      <Tooltip text={[listing.item.description ?? '']}>
        <Image src={listing.item.image} isInCart={isInCart} />
      </Tooltip>
      <Tooltip text={[listing.item.description ?? '']}>
        <Details>
          <Text>{listing.item.name}</Text>
          <Text>
            <Icon src={ItemImages.musu} />
            {listing.buyPrice}
          </Text>
        </Details>
      </Tooltip>
    </Container>
  );
};

const Container = styled.div<{ isInCart: boolean }>`
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  margin: 0.4vw;

  display: flex;
  flex-direction: row nowrap;
  align-items: center;

  cursor: pointer;
  &:hover {
    animation: ${() => hoverFx} 0.2s;
    transform: scale(1.02);
  }
  &:active {
    animation: ${() => clickFx} 0.3s;
  }
`;

const Image = styled.img<{ isInCart: boolean }>`
  background-color: ${({ isInCart }) => (isInCart ? '#bbb' : '#fff')};
  border-right: 0.15vw solid black;
  border-radius: 0.25vw 0 0 0.25vw;
  width: 4.5vw;
  padding: 0.45vw;
  font-family: Pixel;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const Details = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: flex-start;
  height: 100%;
  padding: 0.5vw;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  line-height: 1.5vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin-right: 0.3vw;
`;

const hoverFx = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.02); }
`;

const clickFx = keyframes`
  0% { transform: scale(1.02); }
  50% { transform: scale(.98); }
  100% { transform: scale(1.02); }
`;
