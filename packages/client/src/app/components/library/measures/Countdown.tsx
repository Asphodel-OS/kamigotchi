import { objectClock } from 'assets/images/rooms/13_giftshop';
import styled from 'styled-components';
import { TextTooltip } from '../poppers';

export const Countdown = ({ total, current }: { total: number; current: number }) => {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <TextTooltip text={[`Cooldown: ${Math.round(current)}s`]}>
      <StaminaContainer>
        {`${Math.round(current)}s`}
        <Icon src={objectClock} />
      </StaminaContainer>
      <CooldownFill percent={percent} />
    </TextTooltip>
  );
};

interface CooldownFillProps {
  percent: number;
}

const CooldownFill = styled.div.attrs<CooldownFillProps>(({ percent }) => ({
  style: {
    '--fill': `${Math.min(100, Math.max(0, percent))}%`,
  },
}))<CooldownFillProps>`
  position: absolute;
  left: 82.6%;
  top: 0;
  bottom: 0;
  width: 17.4%;
  background: #bd8fd4ff;
  overflow: hidden;
  border-top-right-radius: 0.45vw;
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--fill);
    background: #faf5c9ff;
    transition: width 0.4s ease;
  }
`;

const StaminaContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0.5%;
  bottom: 0;
  font-size: 0.55vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
  color: #2d0b42ff;
  gap: 0.2vw;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  filter: sepia(1) saturate(200%);
  transform: rotate(20deg);
`;
