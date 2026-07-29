import styled from 'styled-components';

import { EmptyText, IconButton, Text } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { MUSU_INDEX } from 'constants/items';
import { Pool } from 'network/shapes/Pool';
import { fmtPrice } from './utils';

const GREEN = '#C2F0C2';

// a player's stake in one pool, precomputed by the modal each tick
export interface PoolPosition {
  pool: Pool;
  shares: number;
  sharePct: number; // 0-100
  amountA: number; // redeemable now for the full position
  amountB: number;
}

// MUSU-denominated value of the redeemable pair when one side is MUSU: the
// MUSU side plus the item side priced at current reserves. null for item/item
// pools, which have no canonical currency to denominate in
const getMusuValue = (pos: PoolPosition): number | null => {
  const { pool, amountA, amountB } = pos;
  const musuIsA = pool.itemA.index === MUSU_INDEX;
  const musuIsB = pool.itemB.index === MUSU_INDEX;
  if (musuIsA === musuIsB) return null;
  const musuAmt = musuIsA ? amountA : amountB;
  const itemAmt = musuIsA ? amountB : amountA;
  const musuReserve = musuIsA ? pool.reserveA : pool.reserveB;
  const itemReserve = musuIsA ? pool.reserveB : pool.reserveA;
  return itemReserve > 0 ? Math.floor(musuAmt + (itemAmt * musuReserve) / itemReserve) : null;
};

// current price of the non-MUSU item in MUSU, null for item/item pools
const getItemPrice = (pool: Pool): { name: string; price: number } | null => {
  const musuIsA = pool.itemA.index === MUSU_INDEX;
  const musuIsB = pool.itemB.index === MUSU_INDEX;
  if (musuIsA === musuIsB) return null;
  const item = musuIsA ? pool.itemB : pool.itemA;
  const musuReserve = musuIsA ? pool.reserveA : pool.reserveB;
  const itemReserve = musuIsA ? pool.reserveB : pool.reserveA;
  return itemReserve > 0 ? { name: item.name, price: musuReserve / itemReserve } : null;
};

const PositionCard = ({
  position,
  onManage,
}: {
  position: PoolPosition;
  onManage: (poolID: string) => void;
}) => {
  const { pool, shares, sharePct, amountA, amountB } = position;
  const value = getMusuValue(position);
  const priceInfo = getItemPrice(pool);
  return (
    <Card>
      <CardHeader>
        <PairLabel>
          <PairIcons>
            <Sprite src={pool.itemA.image} />
            <Sprite src={pool.itemB.image} />
          </PairIcons>
          <Text size={0.95}>
            {pool.itemA.name} / {pool.itemB.name}
            {pool.disabled ? '  (paused)' : ''}
          </Text>
        </PairLabel>
        <ShareChip>{sharePct < 0.01 ? '<0.01' : sharePct.toFixed(2)}% of pool</ShareChip>
      </CardHeader>

      <HoldingsRow>
        <Holding>
          <HoldingSprite src={pool.itemA.image} alt={pool.itemA.name} />
          <HoldingAmount>{amountA.toLocaleString()}</HoldingAmount>
          <HoldingName>{pool.itemA.name}</HoldingName>
        </Holding>
        <HoldingPlus>+</HoldingPlus>
        <Holding>
          <HoldingSprite src={pool.itemB.image} alt={pool.itemB.name} />
          <HoldingAmount>{amountB.toLocaleString()}</HoldingAmount>
          <HoldingName>{pool.itemB.name}</HoldingName>
        </Holding>
      </HoldingsRow>
      <Caption>redeemable now for {shares.toLocaleString()} shares</Caption>

      <CardFooter>
        <FooterFacts>
          {value !== null && (
            <Fact>
              <FactSprite src={ItemImages.musu} alt='MUSU' />
              <Text size={0.8}>≈ {value.toLocaleString()} MUSU</Text>
            </Fact>
          )}
          {priceInfo && (
            <Text size={0.7} color='#999'>
              1 {priceInfo.name} = {fmtPrice(priceInfo.price)} MUSU
            </Text>
          )}
        </FooterFacts>
        <IconButton scale={1.6} color={GREEN} text='manage' onClick={() => onManage(pool.id)} />
      </CardFooter>
    </Card>
  );
};

export const Positions = ({
  positions,
  onManage,
}: {
  positions: PoolPosition[];
  onManage: (poolID: string) => void;
}) => {
  if (positions.length === 0)
    return (
      <EmptyBox>
        <EmptyText
          text={['No positions yet.', 'Add liquidity to a pool and your stake will show here!']}
          size={0.9}
        />
      </EmptyBox>
    );
  return (
    <List>
      {positions.map((p) => (
        <PositionCard key={p.pool.id} position={p} onManage={onManage} />
      ))}
    </List>
  );
};

/////////////////
// STYLES

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1vh;
`;

const EmptyBox = styled.div`
  padding: 3vh 0;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7vh;
  border: 0.12vw solid #e0e0e0;
  border-radius: 0.6vw;
  background: #fafafa;
  padding: 0.8vw;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;

const PairLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  min-width: 0;
`;

const PairIcons = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const Sprite = styled.img`
  width: 1.6vw;
  height: 1.6vw;
  image-rendering: pixelated;
  user-drag: none;
  &:not(:first-child) {
    margin-left: -0.4vw;
  }
`;

const ShareChip = styled.div`
  flex-shrink: 0;
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  background: #fff;
  padding: 0.2vw 0.5vw;
  font-family: Pixel;
  font-size: 0.65vw;
  color: #555;
`;

const HoldingsRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0.6vw;
  border: 0.12vw solid #e8e8e8;
  border-radius: 0.5vw;
  background: #fff;
  padding: 0.6vw;
`;

const Holding = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4vw;
  min-width: 0;
`;

const HoldingSprite = styled.img`
  width: 2vw;
  height: 2vw;
  image-rendering: pixelated;
  user-drag: none;
  flex-shrink: 0;
`;

const HoldingAmount = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  color: #222;
  white-space: nowrap;
`;

const HoldingName = styled.div`
  font-family: Pixel;
  font-size: 0.7vw;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HoldingPlus = styled.div`
  align-self: center;
  font-family: Pixel;
  font-size: 1vw;
  color: #bbb;
  flex-shrink: 0;
`;

const Caption = styled.div`
  font-family: Pixel;
  font-size: 0.62vw;
  color: #aaa;
  text-align: center;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6vw;
`;

const FooterFacts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
  min-width: 0;
`;

const Fact = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35vw;
`;

const FactSprite = styled.img`
  width: 1.2vw;
  height: 1.2vw;
  image-rendering: pixelated;
  user-drag: none;
`;
