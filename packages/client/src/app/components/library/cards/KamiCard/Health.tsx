import { StatIcons } from 'constants/stats';
import styled from 'styled-components';
import { TextTooltip } from '../..';

export const Health = ({ current, total }: { current: number; total: number }) => {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <TextTooltip text={[`Health: ${current}/${total}`]}>
      <HealthContainer>
        {current}/{total}
        <Icon src={StatIcons.health} />
      </HealthContainer>
      <HealthFill $percent={percent} />
    </TextTooltip>
  );
};

const HealthContainer = styled.div`
  position: absolute;
  top: 5%;
  right: 17.1%;
  font-size: 0.55vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
  color: #61178fff;
  gap: 0.1vw;
  padding: 0.1vw 0.3vw;
  margin-left: auto;
  margin-right: 0.3vw;
`;

const HealthFill = styled.div<{ $percent: number }>`
  position: absolute;
  overflow: hidden;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  width: 81%;
  background: #faf5c9ff;
  border-right: solid black 0.15vw;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
    background: ${({ $percent }) => {
      const clamped = Math.min(100, Math.max(0, $percent));
      if (clamped > 50) {
        return ` #AACC00`;
      }
      if (clamped > 30) {
        return `linear-gradient(to right,   #e0bc1aff   10%, #AACC00 70%)`;
      }
      return `linear-gradient(to right,   #CC3F00   10%, #e0bc1aff 30%)`;
    }};
    transition: width 0.4s ease;
  }
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  transform: rotate(20deg);
`;
