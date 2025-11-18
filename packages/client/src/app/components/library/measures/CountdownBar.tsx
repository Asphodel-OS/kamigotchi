import styled from 'styled-components';

import { objectClock } from 'assets/images/rooms/13_giftshop';
import { calcPercent } from 'utils/numbers';
import { TextTooltip } from '../poppers';

export const CountdownBar = ({ total, current }: { total: number; current: number }) => {
  return (
    <TextTooltip text={[`Cooldown: ${Math.round(current)}s`]}>
      <StaminaContainer>
        {`${Math.round(current)}s`}
        <Icon src={objectClock} />
      </StaminaContainer>
      <CooldownFill percent={calcPercent(current, total)} />
    </TextTooltip>
  );
};

interface CooldownFillProps {
  percent: number;
}

const StaminaContainer = styled.div`
  position: absolute;
  margin-left: 0.3vw;
  gap: 0.2vw;
  top: 12%;
  right: 1%;
  z-index: 1;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  font-size: 0.55vw;
  font-weight: bold;
  color: #2d0b42ff;
`;

const CooldownFill = styled.div.attrs<CooldownFillProps>(({ percent }) => ({
  style: {
    '--fill': `${Math.min(100, Math.max(0, percent))}%`,
  },
}))<CooldownFillProps>`
  position: absolute;
  overflow: hidden;
  border-top-right-radius: 0.45vw;

  top: 0;
  bottom: 0;
  right: 0;
  width: 19.9%;
  background: #bd8fd4ff;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--fill);
    border-top-right-radius: 0.6vw;
    background: #faf5c9ff;
    transition: width 0.4s ease;
  }
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  filter: sepia(1) saturate(200%);
  transform: rotate(20deg);
`;
