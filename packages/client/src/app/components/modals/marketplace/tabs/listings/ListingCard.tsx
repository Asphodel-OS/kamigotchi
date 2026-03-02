import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { OperatorIcon } from 'assets/images/icons/menu';
import { InfoIcon } from 'assets/images/icons/misc';
import { TokenIcons } from 'assets/images/tokens';
import { KamiMarketListing } from 'clients/kamiden';
import { AffinityColors, AffinityIcons } from 'constants/affinities';
import { StatColors, StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

type ListingCardListingProps = {
  variant?: 'listing';
  listing: KamiMarketListing;
  kami: Kami | undefined;
  isInCart: boolean;
  isExpired: boolean;
  isOwn: boolean;
  formatPrice: (weiString: string) => string;
  onAddToCart: (listing: KamiMarketListing) => void;
  onRemoveFromCart: (orderId: string) => void;
  onOpenKami: (kamiIndex: number) => void;
  getAccountByID: (id: string) => { name: string; index: number };
  allFlipped: boolean;
};

type ListingCardAdoptionProps = {
  variant: 'adoption';
  kami: Kami | undefined;
  onOpenKami?: (kamiIndex: number) => void;
  allFlipped?: boolean;
  priceLabel?: string;
};

type ListingCardProps = ListingCardListingProps | ListingCardAdoptionProps;

const STAT_KEYS = ['health', 'power', 'violence', 'harmony', 'slots'] as const;
type StatKey = (typeof STAT_KEYS)[number];

export const ListingCard = memo(({
  variant = 'listing',
  kami,
  allFlipped = false,
  onOpenKami = () => {},
  ...rest
}: ListingCardProps) => {
  /////////////////
  // PREPARATION

  const isListing = variant === 'listing';
  const listingProps = isListing ? (rest as ListingCardListingProps) : null;
  const listing = listingProps?.listing;

  const [flipped, setFlipped] = useState(allFlipped);

  useEffect(() => {
    setFlipped(allFlipped);
  }, [allFlipped]);

  const stats = kami?.stats;
  const traits = kami?.traits;
  const level = kami?.progress?.level;
  const seller = listing ? listingProps?.getAccountByID(listing.SellerAccountID) : undefined;

  const bodyAffinity = useMemo(
    () => (traits?.body?.affinity?.toLowerCase() as keyof typeof AffinityColors | undefined),
    [traits?.body?.affinity]
  );
  const handAffinity = useMemo(
    () => (traits?.hand?.affinity?.toLowerCase() as keyof typeof AffinityColors | undefined),
    [traits?.hand?.affinity]
  );

  const isInCart = listingProps?.isInCart ?? false;
  const isExpired = listingProps?.isExpired ?? false;
  const isOwn = listingProps?.isOwn ?? false;
  const isLocked = isListing ? isExpired || isOwn : false;

  const kamiIndex = listing ? listing.KamiIndex : kami?.index;
  const adoptionPriceLabel = !isListing ? (rest as ListingCardAdoptionProps).priceLabel : undefined;
  const listingPriceLabel =
    listing && listingProps ? listingProps.formatPrice(listing.Price) : undefined;
  const priceLabel = isListing ? listingPriceLabel : adoptionPriceLabel;
  const showInfoButton = kamiIndex !== undefined;

  const badgeChar = isLocked ? '\u00d7' : isInCart ? '-' : '+';
  const badgeColor = isLocked ? '#888' : isInCart ? '#F8D6D6' : '#C2F0C2';
  const badgeTooltip = isOwn ? 'Your listing' : isExpired ? 'Expired listing' : '';

  const statRows = useMemo(() => {
    return STAT_KEYS.map((key) => {
      const stat = stats?.[key];
      const color = key !== 'slots' ? StatColors[key as keyof typeof StatColors] : '#e0e0e0';
      return (
        <StatRow key={key} $bg={color}>
          <StatIconImg src={StatIcons[key as StatKey]} />
          <StatValue>{stat ? Math.round(stat.total) : '?'}</StatValue>
        </StatRow>
      );
    });
  }, [stats]);

  /////////////////
  // INTERACTION

  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      playClick();
      if (!listingProps || !listing) return;
      if (isInCart) listingProps.onRemoveFromCart(listing.OrderID);
      else listingProps.onAddToCart(listing);
    },
    [isInCart, listing, listingProps]
  );

  const handleFlipToBack = useCallback(() => {
    playClick();
    setFlipped(true);
  }, []);

  const handleFlipToFront = useCallback(() => {
    playClick();
    setFlipped(false);
  }, []);

  const handleOpenKami = useCallback(() => {
    if (kamiIndex === undefined) return;
    playClick();
    onOpenKami(kamiIndex);
  }, [kamiIndex, onOpenKami]);

  /////////////////
  // RENDER

  const BadgeElement = isListing ? (
    <CartBadge
      $color={badgeColor}
      onClick={isLocked ? undefined : handleBadgeClick}
      disabled={isLocked}
    >
      {badgeChar}
    </CartBadge>
  ) : null;

  const WrappedBadge = isListing && badgeTooltip ? (
    <TextTooltip text={[badgeTooltip]}>{BadgeElement}</TextTooltip>
  ) : (
    BadgeElement
  );

  return (
    <CardContainer>
      <CardInner $flipped={flipped}>
        {/* ===== FRONT ===== */}
        <CardFront $flipped={flipped}>
          {kami ? (
            <KamiImage src={kami.image} alt={kami.name} onClick={handleFlipToBack} />
          ) : (
            <ImagePlaceholder />
          )}

          {isListing && <RightColumn>{WrappedBadge}</RightColumn>}

          {(priceLabel || showInfoButton) && (
            <BottomBar $alignRight={!priceLabel}>
              {priceLabel && (
                <PriceChip>
                  <EthIcon src={TokenIcons.eth} />
                  <PriceText>{priceLabel}</PriceText>
                </PriceChip>
              )}
              {showInfoButton && (
                <FlipBtn onClick={handleOpenKami}>
                  <InfoIconImg src={InfoIcon} />
                </FlipBtn>
              )}
            </BottomBar>
          )}
        </CardFront>

        {/* ===== BACK ===== */}
        <CardBack $flipped={flipped} onClick={handleFlipToFront}>
          <RightColumn>
            {isListing && WrappedBadge}
            {level !== undefined && (
              <LevelCard>
                <LevelLabel>Lv.</LevelLabel>
                <LevelValue>{level}</LevelValue>
              </LevelCard>
            )}
          </RightColumn>

          <BackContent>
            <StatsSection>{statRows}</StatsSection>

            {(bodyAffinity || handAffinity) && (
              <AffinitySection>
                {bodyAffinity && (
                  <AffinityCard $bg={AffinityColors[bodyAffinity] ?? '#ccc'}>
                    <AffinityIconImg src={AffinityIcons[bodyAffinity]} />
                  </AffinityCard>
                )}
                {handAffinity && (
                  <AffinityCard $bg={AffinityColors[handAffinity] ?? '#ccc'}>
                    <AffinityIconImg src={AffinityIcons[handAffinity]} />
                  </AffinityCard>
                )}
              </AffinitySection>
            )}
          </BackContent>

          {isListing && (
            <BackBottomBar>
              <SellerChip>
                <SellerIcon src={OperatorIcon} />
                <SellerName>{seller?.name || 'Unknown'}</SellerName>
              </SellerChip>
            </BackBottomBar>
          )}
        </CardBack>
      </CardInner>
    </CardContainer>
  );
});

// ─── 3D Flip Shell ────────────────────────────────────────

const CardContainer = styled.div`
  perspective: 40vw;
`;

const CardInner = styled.div<{ $flipped: boolean }>`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  transform-style: preserve-3d;
  transition: transform 0.6s ease-in-out;
  transform: ${({ $flipped }) => ($flipped ? 'rotateY(180deg)' : 'rotateY(0)')};
`;

const CardFace = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border: 0.18vw solid black;
  border-radius: 0.55vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  cursor: default;
`;

// ─── Right Column (cart badge + level) ────────────────────

const RightColumn = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 65%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.15vw;
`;

const CartBadge = styled.button<{ $color: string }>`
  width: 2.55vw;
  height: 1.4vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color};
  color: #000;
  font-size: 0.85vw;
  font-weight: 700;
  line-height: 1;
  border: 0.18vw solid black;
  border-top: none;
  border-right: none;
  border-radius: 0 0.4vw 0 0.3vw;
  cursor: pointer;
  transition: filter 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  &:hover:not(:disabled) {
    filter: brightness(1.2);
  }
`;

const LevelCard = styled.div`
  background: #1b6b5a;
  width: 2.55vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  border-radius: 0.25vw 0 0 0.25vw;
`;

const LevelLabel = styled.span`
  font-size: 0.4vw;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1;
  margin-bottom: 0.1vw;
`;

const LevelValue = styled.span`
  font-size: 0.8vw;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
`;

// ─── Front Face ───────────────────────────────────────────

const CardFront = styled(CardFace)<{ $flipped: boolean }>`
  background: #e0e0e0;
  pointer-events: ${({ $flipped }) => ($flipped ? 'none' : 'auto')};
`;

const KamiImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-drag: none;
`;

const ImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #d0d0d0 0%, #c8c8c8 50%, #bbb 100%);
`;

const BottomBar = styled.div<{ $alignRight?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: ${({ $alignRight }) => ($alignRight ? 'flex-end' : 'space-between')};
  padding: 0.35vw;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #bbb;
    opacity: 0.6;
    border-top: solid black 0.15vw;
  }

  & > * {
    position: relative;
  }
`;

const PriceChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.18vw;
`;

const EthIcon = styled.img`
  width: 1.1vw;
  height: 1.1vw;
`;

const PriceText = styled.div`
  font-size: 0.68vw;
  font-weight: 600;
  color: black;
  text-shadow: 0 0 0.5vw white;
  height: 0.85vw;
  display: flex;
  align-items: center;
  position: relative;
  top: 0.06vw;
`;

const FlipBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.1vw;
  display: flex;
  align-items: center;
  opacity: 0.75;
  transition: opacity 0.15s;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  &:hover {
    opacity: 1;
  }
  &:focus-visible {
    outline: none;
  }
`;

const InfoIconImg = styled.img`
  width: 0.85vw;
  height: 0.85vw;
  cursor: pointer;
`;

// ─── Back Face ────────────────────────────────────────────

const CardBack = styled(CardFace)<{ $flipped: boolean }>`
  transform: rotateY(180deg);
  background: #fff8e7;
  justify-content: space-between;
  padding: 0.3vw 0.35vw 0.35vw;
  pointer-events: ${({ $flipped }) => ($flipped ? 'auto' : 'none')};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

const BackContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
  flex: 1;
`;

const StatsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.18vw;
  width: 65%;
`;

const StatRow = styled.div<{ $bg: string }>`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  padding: 0.15vw 0.3vw;
  border-radius: 0.25vw;
  background: ${({ $bg }) => $bg};
`;

const StatIconImg = styled.img`
  width: 0.8vw;
  height: 0.8vw;
`;

const StatValue = styled.span`
  font-size: 0.55vw;
  font-weight: 600;
`;

const AffinitySection = styled.div`
  display: flex;
  gap: 0.18vw;
  margin-bottom: 0.25vw;
`;

const AffinityCard = styled.div<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  width: 2.1vw;
  height: 2.1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25vw;
  border: 0.07vw solid rgba(0, 0, 0, 0.2);
`;

const AffinityIconImg = styled.img`
  width: 1.34vw;
  height: 1.34vw;
`;

const SellerChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.18vw;
  min-width: 0;
`;

const SellerIcon = styled.img`
  width: 1.04vw;
  height: 1.15vw;
  flex-shrink: 0;
`;

const SellerName = styled.span`
  font-size: 0.46vw;
  font-weight: 500;
  color: #555;
`;

const BackBottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.2vw;
  border-top: 0.07vw solid rgba(0, 0, 0, 0.1);
`;
