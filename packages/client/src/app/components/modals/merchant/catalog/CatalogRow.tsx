import styled from 'styled-components';

import { calcListingBuyPrice } from 'app/cache/npc';
import { Overlay, Pairing, TextTooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
import { MenuIcons } from 'assets/images/icons/menu';
import { PricingIcons } from 'assets/images/icons/pricing';
import { Account } from 'network/shapes/Account';
import { Listing } from 'network/shapes/Listing';
import { getItemImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { CartItem } from '../types';

// TODO: support multiple buys
export const CatalogRow = ({
  account,
  cart,
  listing,
  toggle,
}: {
  account: Account;
  cart: CartItem[];
  listing: Listing;
  toggle: () => void;
}) => {
  const { item, payItem, buy } = listing;

  const handleClick = () => {
    playClick();
    toggle();
  };

  /////////////////
  // INTERPRETATION

  const getPricingIcon = (listing: Listing) => {
    const key = listing.buy?.type.toLowerCase() ?? '';
    return PricingIcons[key as keyof typeof PricingIcons];
  };

  const getPricingTooltip = () => {
    if (!listing.buy) return ['the pricing calculation on this listing is unknown'];
    const pricing = listing.buy;
    const tooltip: string[] = [];

    const type = pricing.type;
    if (type === 'GDA') {
      const rate = pricing.rate;
      const period = pricing.period! / 3600;
      return [
        `This listing is priced Dynamically`,
        `targeting ${rate} sales every ${period.toFixed(0)} hours`,
      ];
    } else if (type === 'FIXED') {
      return [`This listing is priced Statically`, `at ${listing.value} MUSU`];
    }

    if (buy?.type) tooltip.push(buy.type);
    if (buy?.period) tooltip.push(`Duration: ${buy.period}`);
    return tooltip;
  };

  const getItemTooltip = () => {
    const tooltip: string[] = [];
    if (item.description) tooltip.push(item.description);
    if (item.effects) tooltip.push(`Requirements: ${item.effects.use}`);
    return tooltip;
  };

  const getInventoryQuantity = () => {
    if (!account.inventories) return 0;
    const inv = account.inventories?.find((inv) => {
      if (!inv || !inv.item) return false;
      return inv.item.index === item.index;
    });
    return inv?.balance ?? 0;
  };

  const isInCart = () => {
    return cart.some((c) => c.listing.item.index === item.index);
  };

  /////////////////
  // RENDER

  return (
    <Container
      key={item.index}
      onClick={() => handleClick()}
      isInCart={isInCart()}
      effectScale={0.02}
    >
      <TextTooltip text={getItemTooltip()}>
        <Image src={listing.item.image} isInCart={isInCart()} />
      </TextTooltip>
      <Details>
        <Pairing
          icon={getPricingIcon(listing)}
          text={item.name}
          scale={0.9}
          tooltip={getPricingTooltip()}
        />
        <Pairing
          icon={getItemImage(payItem.name)}
          text={calcListingBuyPrice(listing, 1).toLocaleString()}
          scale={0.9}
        />
      </Details>
      <Overlay bottom={0.3} right={0.6} orientation='row'>
        <Pairing
          icon={MenuIcons.inventory}
          text={getInventoryQuantity().toLocaleString()}
          scale={0.75}
          reverse
        />
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{
  isInCart: boolean;
  effectScale: number;
}>`
  position: relative;
  border: 0.15em solid black;
  border-radius: 0.4em;
  background-color: ${({ isInCart }) => (isInCart ? '#bbb' : '#fff')};

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
  border-right: 0.15em solid black;
  border-radius: 0.25em 0 0 0.25em;
  width: 4.5em;
  padding: 0.45em;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const Details = styled.div`
  display: flex;
  flex-flow: column nowrap;
  justify-content: space-around;
  align-items: flex-start;
  height: 100%;
  padding: 0.5em;
`;
