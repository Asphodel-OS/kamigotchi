import styled from 'styled-components';

import { StatIcons } from 'constants/stats';
import { TextTooltip } from '../..';

export const Health = ({
  current,
  total,
  color,
}: {
  current: number;
  total: number;
  color: string;
}) => {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <TextTooltip text={[`${percent.toFixed(1)}%`]}>
      <HealthContainer>
        {current}/{total}
        <Icon src={StatIcons.health} />
      </HealthContainer>
      <HealthFill $percent={percent} color={color} />
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

const HealthFill = styled.div<{ $percent: number; color: string }>`
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
    width: ${({ $percent }) => $percent}%;
    background: ${({ color }) => color};
    transition: width 0.4s ease;
  }
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  transform: rotate(20deg);
`;
