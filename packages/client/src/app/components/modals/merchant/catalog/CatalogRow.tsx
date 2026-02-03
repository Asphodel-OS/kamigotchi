import styled from 'styled-components';

import { calcListingBuyPrice } from 'app/cache/npc';
import { Pairing, TextTooltip } from 'app/components/library';
import { clickFx, hoverFx } from 'app/styles/effects';
import { MenuIcons } from 'assets/images/icons/menu';
import { PricingIcons } from 'assets/images/icons/pricing';
import { Account } from 'network/shapes/Account';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { Listing } from 'network/shapes/Listing';
import { DetailedEntity, getItemImage } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { CartItem } from '../types';

// TODO: support multiple buys
export const CatalogRow = ({
  account,
  cart,
  listing,
  toggle,
  utils,
}: {
  account: Account;
  cart: CartItem[];
  listing: Listing;
  toggle: () => void;
  utils: {
    parseAllos: (allo: Allo[]) => DetailedEntity[];
    displayRequirements: (item: Item) => string;
  };
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
    const tooltip: (string | JSX.Element)[] = [];
    if (item.description) tooltip.push(item.description);

    const requirementsText = utils.displayRequirements(item);
    tooltip.push(`Requirements: ${requirementsText}`);

    const effectsList =
      item.effects?.use?.length > 0
        ? utils
            .parseAllos(item.effects.use)
            .map((entry) => entry?.description ?? '')
            .join('\n')
        : 'None';
    tooltip.push(`Effects: ${effectsList}`);

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
        <Pairing icon={getPricingIcon(listing)} text={item.name} tooltip={getPricingTooltip()} />
        <Pairing
          icon={getItemImage(payItem.name)}
          text={calcListingBuyPrice(listing, 1).toLocaleString()}
        />
        <Pairing
          icon={MenuIcons.inventory}
          text={getInventoryQuantity().toLocaleString()}
          reverse
        />
      </Details>
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

  @media (max-aspect-ratio: 11/16) or (width < 900px) {
    width: 3em;
    padding: 0.3em;
  }
`;

const Details = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  align-items: flex-start;
  height: 100%;
  padding: 0.5em;
  overflow: hidden;
  flex: 1;
  min-width: 0;

  @media (max-aspect-ratio: 11/16) or (width < 900px) {
    padding: 0.3em;
    font-size: 0.85em;
  }
`;
