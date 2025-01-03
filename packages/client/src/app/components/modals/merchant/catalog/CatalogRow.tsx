import styled from 'styled-components';

import { calcBuyPrice } from 'app/cache/npc/functions';
import { Tooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
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
    <Tooltip text={[listing.item.description ?? '']}>
      <Container
        key={listing.item.index}
        onClick={() => handleClick()}
        isInCart={isInCart}
        effectScale={0.02}
      >
        <Image src={listing.item.image} isInCart={isInCart} />
        <Details>
          <Text>{listing.item.name}</Text>
          <Text>
            <Icon src={ItemImages.musu} />
            {calcBuyPrice(listing, 1)}
          </Text>
        </Details>{' '}
      </Container>
    </Tooltip>
  );
};

interface ContainerProps {
  isInCart: boolean;
  effectScale: number;
}

const Container = styled.div<ContainerProps>`
  border: 0.15vw solid black;
  border-radius: 0.4vw;

  display: flex;
  flex-direction: row nowrap;
  align-items: center;

  cursor: pointer;
  &:hover {
    animation: ${({ effectScale }) => hoverFx(effectScale)} 0.2s;
    transform: scale(${({ effectScale }) => 1 + effectScale});
  }
  &:active {
    animation: ${({ effectScale }) => clickFx(effectScale)} 0.3s;
  }
`;

const Image = styled.img<{ isInCart: boolean }>`
  background-color: ${({ isInCart }) => (isInCart ? '#bbb' : '#fff')};
  border-right: 0.15vw solid black;
  border-radius: 0.25vw 0 0 0.25vw;
  width: 4.5vw;
  padding: 0.45vw;
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
