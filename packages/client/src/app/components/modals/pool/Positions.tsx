import styled from 'styled-components';

import { EmptyText, IconButton, Text, TextTooltip } from 'app/components/library';
import { ActionIcons } from 'assets/images/icons/actions';
import { Pool } from 'network/shapes/Pool';

const GREEN = '#C2F0C2';

// a player's stake in one pool, precomputed by the modal each tick
export interface PoolPosition {
  pool: Pool;
  shares: number;
  sharePct: number; // 0-100
  amountA: number; // redeemable now for the full position
  amountB: number;
}

const PositionCard = ({
  position,
  onManage,
}: {
  position: PoolPosition;
  onManage: (poolID: string) => void;
}) => {
  const { pool, sharePct, amountA, amountB } = position;
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
        </Holding>
        <HoldingPlus>+</HoldingPlus>
        <Holding>
          <HoldingSprite src={pool.itemB.image} alt={pool.itemB.name} />
          <HoldingAmount>{amountB.toLocaleString()}</HoldingAmount>
        </Holding>
        <TextTooltip text={['Inspect Pool']} direction='row'>
          <IconButton
            img={ActionIcons.search}
            color={GREEN}
            radius={0.9}
            onClick={() => onManage(pool.id)}
          />
        </TextTooltip>
      </HoldingsRow>
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
  align-items: center;
  gap: 0.6vw;
  border: 0.12vw solid #e8e8e8;
  border-radius: 0.5vw;
  background: #fff;
  padding: 0.4vw 0.6vw;
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

const HoldingPlus = styled.div`
  align-self: center;
  font-family: Pixel;
  font-size: 1vw;
  color: #bbb;
  flex-shrink: 0;
`;
