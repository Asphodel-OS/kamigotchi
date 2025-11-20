import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcHealth, isResting } from 'app/cache/kami';
import { HealthColors } from 'constants/kamis/health';
import { StatIcons } from 'constants/stats';
import { Kami } from 'network/shapes';
import { calcPercentBounded } from 'utils/numbers/percents';
import { Text, TextTooltip } from '../../..';

export const Health = ({ kami, tick }: { kami: Kami; tick: number }) => {
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [percent, setPercent] = useState(0);

  // update the current health percent on the kami on each tick
  useEffect(() => {
    const totHealth = kami.stats?.health.total ?? 0;
    const currHealth = calcHealth(kami);
    const percent = calcPercentBounded(currHealth, totHealth);
    setCurrent(currHealth);
    setTotal(totHealth);
    setPercent(percent);
  }, [tick]);

  /////////////////
  // INTERPRETATION

  // get the color of the kami's status bar
  const getColor = (percent: number) => {
    if (isResting(kami)) return HealthColors.resting;
    if (percent <= 25) return HealthColors.dying;
    if (percent <= 50) return HealthColors.vulnerable;
    if (percent <= 75) return HealthColors.exposed;
    return HealthColors.healthy;
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Fill $percent={percent} $color={getColor(percent)} />
      <TextTooltip text={[`${percent.toFixed(1)}%`]}>
        <Pairing>
          <Text size={0.45} color='#61178f' weight='bold' style={{ zIndex: 1 }}>
            {current}/{total}
          </Text>
          <Icon src={StatIcons.health} />
        </Pairing>
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border-right: solid black 0.15vw;

  height: 100%;
  flex-grow: 7;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const Fill = styled.div<{ $percent: number; $color: string }>`
  position: absolute;
  overflow: hidden;
  height: 100%;
  width: 100%;
  background: #faf5c9ff;

  &::after {
    content: '';
    position: absolute;
    height: 100%;
    width: ${({ $percent }) => $percent}%;
    background: ${({ $color }) => $color};
    transition: width 0.4s ease;
  }
`;

const Pairing = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  gap: 0.15vw;
  z-index: 1;
  margin-right: 0.3vw;
`;

const Icon = styled.img`
  height: 1.2vw;
  width: 1.2vw;
  transform-origin: center;
  transform: rotate(20deg);
  user-drag: none;
`;
