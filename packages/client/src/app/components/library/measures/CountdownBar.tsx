import styled from 'styled-components';

import { objectClock } from 'assets/images/rooms/13_giftshop';
import { calcPercent } from 'utils/numbers';
import { Text } from '../text';

export const CountdownBar = ({ total, current }: { total: number; current: number }) => {
  return (
    <Container>
      <Fill percent={calcPercent(current, total)} />
      <Text size={0.55} color='#2d0b42ff' weight='bold' style={{ zIndex: 1 }}>
        {current === 0 ? 'ready' : `${Math.floor(current)}s`}
      </Text>
      <Icon src={objectClock} />
    </Container>
  );
};

interface FillProps {
  percent: number;
}

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  gap: 0.2vw;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const Fill = styled.div.attrs<FillProps>(({ percent }) => ({
  style: {
    '--fill': `${Math.min(100, Math.max(0, percent))}%`,
  },
}))<FillProps>`
  position: absolute;
  overflow: hidden;
  border-top-right-radius: 0.6vw;

  width: 100%;
  height: 100%;
  background: #bd8fd4ff;

  &::after {
    content: '';
    position: absolute;
    height: 100%;
    width: var(--fill);
    background: #faf5c9ff;
    transition: width 0.4s ease;
  }
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  margin-right: 0.2vw;

  filter: sepia(1) saturate(200%);
  transform: rotate(20deg);

  user-drag: none;
  -webkit-user-drag: none;
`;
