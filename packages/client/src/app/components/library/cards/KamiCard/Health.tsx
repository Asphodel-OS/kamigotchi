import { StatIcons } from 'constants/stats';
import styled from 'styled-components';
import { TextTooltip } from '../..';

export const Health = ({ current, total }: { current: number; total: number }) => {
  return (
    <TextTooltip text={[`Health: ${current}/${total}`]}>
      <HealthContainer>
        {current}/{total}
        <Icon src={StatIcons.health} />
      </HealthContainer>
      <HealthFill $percent={(100 * current) / total} />
    </TextTooltip>
  );
};

const HealthFill = styled.div<{ $percent: number }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: calc(83%);
  overflow: hidden;
  background: #fdf0ecff;
  border-right: solid black 0.15vw;
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $percent }) => Math.min(100, Math.max(0, $percent))}%;
    background: #d7bce8;
    transition: width 0.4s ease;
  }
`;
const HealthContainer = styled.div`
  position: absolute;
  right: 18%;
  top: 0;
  bottom: 0;
  font-size: 0.6vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
  color: #61178fff;
  gap: 0.1vw;
`;
const Icon = styled.img`
  height: 1.3vw;
  width: 1.3vw;

  filter: sepia(1) saturate(200%);

  transform: rotate(20deg);
`;
