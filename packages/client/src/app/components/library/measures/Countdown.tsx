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

const StaminaContainer = styled.div`
  position: absolute;
  top: 12%;
  right: 1%;
  font-size: 0.55vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
  color: #2d0b42ff;
  gap: 0.2vw;
  margin-left: 0.3vw;
`;

const CooldownFill = styled.div.attrs<CooldownFillProps>(({ percent }) => ({
  style: {
    '--fill': `${Math.min(100, Math.max(0, percent))}%`,
  },
}))<CooldownFillProps>`
  position: absolute;
  overflow: hidden;
  top: 0;
  bottom: 0;
  right: 0;
  background: #bd8fd4ff;
  width: 19.9%;
  border-top-right-radius: 0.6vw;
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
