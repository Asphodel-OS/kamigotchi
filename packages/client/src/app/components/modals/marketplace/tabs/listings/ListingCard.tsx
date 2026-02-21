import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { OperatorIcon, ResetIcon } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import { KamiMarketListing } from 'clients/kamiden';
import { AffinityColors, AffinityIcons } from 'constants/affinities';
import { StatColors, StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes/Kami';

interface ListingCardProps {
  listing: KamiMarketListing;
  kami: Kami | undefined;
  isInCart: boolean;
  isExpired: boolean;
  formatPrice: (weiString: string) => string;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  onOpenKami: () => void;
  getAccountByID: (id: string) => { name: string; index: number };
  allFlipped: boolean;
}

const STAT_KEYS = ['health', 'power', 'violence', 'harmony', 'slots'] as const;
type StatKey = (typeof STAT_KEYS)[number];

export const ListingCard = ({
  listing,
  kami,
  isInCart,
  isExpired,
  formatPrice,
  onAddToCart,
  onRemoveFromCart,
  onOpenKami,
  getAccountByID,
  allFlipped,
}: ListingCardProps) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(allFlipped);
  }, [allFlipped]);

  const stats = kami?.stats;
  const traits = kami?.traits;
  const level = kami?.progress?.level;
  const seller = getAccountByID(listing.SellerAccountID);
  const bodyAffinity = traits?.body?.affinity?.toLowerCase() as
    | keyof typeof AffinityColors
    | undefined;
  const handAffinity = traits?.hand?.affinity?.toLowerCase() as
    | keyof typeof AffinityColors
    | undefined;

  const badgeClick = isExpired ? undefined : isInCart ? onRemoveFromCart : onAddToCart;
  const badgeChar = isExpired ? 'x' : isInCart ? '-' : '+';
  const badgeColor = isExpired ? '#888' : isInCart ? '#d04a2f' : '#3a8f47';

  return (
    <CardContainer>
      <CardInner $flipped={flipped}>
        {/* ===== FRONT ===== */}
        <CardFront>
          {kami ? (
            <KamiImage src={kami.image} alt={kami.name} onClick={onOpenKami} />
          ) : (
            <ImagePlaceholder />
          )}

          <RightColumn>
            <CartBadge $color={badgeColor} onClick={badgeClick} disabled={isExpired}>
              {badgeChar}
            </CartBadge>
          </RightColumn>

          <BottomBar>
            <PriceChip>
              <EthIcon src={TokenIcons.eth} />
              <PriceText>{formatPrice(listing.Price)}</PriceText>
            </PriceChip>
            <FlipBtn onClick={() => setFlipped(true)}>
              <FlipIconImg src={ResetIcon} />
            </FlipBtn>
          </BottomBar>
        </CardFront>

        {/* ===== BACK ===== */}
        <CardBack>
          <RightColumn>
            <CartBadge $color={badgeColor} onClick={badgeClick} disabled={isExpired}>
              {badgeChar}
            </CartBadge>
            {level !== undefined && (
              <LevelCard>
                <LevelLabel>Lv.</LevelLabel>
                <LevelValue>{level}</LevelValue>
              </LevelCard>
            )}
          </RightColumn>

          <BackContent>
            <StatsSection>
              {STAT_KEYS.map((key) => {
                const stat = stats?.[key];
                const color =
                  key !== 'slots' ? StatColors[key as keyof typeof StatColors] : '#e0e0e0';
                return (
                  <StatRow key={key} $bg={color}>
                    <StatIconImg src={StatIcons[key as StatKey]} />
                    <StatValue>{stat ? Math.round(stat.total) : '?'}</StatValue>
                  </StatRow>
                );
              })}
            </StatsSection>

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

          <BackBottomBar>
            <SellerChip>
              <SellerIcon src={OperatorIcon} />
              <SellerName>{seller.name || 'Unknown'}</SellerName>
            </SellerChip>
            <FlipBtn onClick={() => setFlipped(false)}>
              <FlipIconImgDark src={ResetIcon} />
            </FlipBtn>
          </BackBottomBar>
        </CardBack>
      </CardInner>
    </CardContainer>
  );
};

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
  border: 0.13vw solid black;
  border-radius: 0.55vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 0.85vw;
  font-weight: 700;
  line-height: 1.4vw;
  text-align: center;
  border: none;
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
  background: #1B6B5A;
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

const CardFront = styled(CardFace)`
  background: #111;
`;

const KamiImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  cursor: pointer;
`;

const ImagePlaceholder = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
`;

const BottomBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35vw;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-top: 0.07vw solid rgba(255, 255, 255, 0.08);
`;

const PriceChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.18vw;
`;

const EthIcon = styled.img`
  width: 0.8vw;
  height: 0.8vw;
`;

const PriceText = styled.span`
  font-size: 0.57vw;
  font-weight: 600;
  color: #fff;
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
  &:hover {
    opacity: 1;
  }
`;

const FlipIconImg = styled.img`
  width: 1.15vw;
  height: 1.15vw;
  filter: brightness(3);
`;

const FlipIconImgDark = styled.img`
  width: 1.15vw;
  height: 1.15vw;
  opacity: 0.5;
`;

// ─── Back Face ────────────────────────────────────────────

const CardBack = styled(CardFace)`
  transform: rotateY(180deg);
  background: #FFF8E7;
  justify-content: space-between;
  padding: 0.3vw 0.35vw 0.35vw;
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
  width: 65%;
`;

const AffinityCard = styled.div<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  flex: 1;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25vw;
  border: 0.07vw solid rgba(0, 0, 0, 0.2);
`;

const AffinityIconImg = styled.img`
  width: 65%;
  height: 65%;
`;

const SellerChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.18vw;
  min-width: 0;
`;

const SellerIcon = styled.img`
  width: 0.8vw;
  height: 0.8vw;
  flex-shrink: 0;
`;

const SellerName = styled.span`
  font-size: 0.46vw;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 5vw;
`;

const BackBottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.2vw;
  border-top: 0.07vw solid rgba(0, 0, 0, 0.1);
`;
