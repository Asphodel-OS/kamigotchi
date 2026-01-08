import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { calcCooldown, calcCooldownRequirement } from 'app/cache/kami';
import { Kami } from 'network/shapes/Kami';
import { TextTooltip } from '../tooltips';

const getCooldownColor = (percent: number) => {
  if (percent < 20) return '#FF6611'; // orange/red - just started
  if (percent < 50) return '#FFD022'; // yellow - in progress
  return '#23BD41'; // green - almost ready
};

export const Cooldown = ({
  kami,
  children,
}: {
  kami: Kami;
  children:
    | React.ReactElement<{ cooldownBackground?: string }>
    | React.ReactElement<{ cooldownBackground?: string }>[];
}) => {
  const [lastTick, setLastTick] = useState(Date.now());
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);

  // ticking and setting total cooldown on mount
  useEffect(() => {
    const total = calcCooldownRequirement(kami);
    setTotal(total);

    const refreshClock = () => setLastTick(Date.now());
    const timerId = setInterval(refreshClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  // update the total of the cooldown meter whenever the kami changes
  useEffect(() => {
    const total = calcCooldownRequirement(kami);
    setTotal(total);
  }, [kami.bonuses?.general.cooldown]);

  // update the remaining time on the cooldown
  useEffect(() => {
    const currentCooldown = calcCooldown(kami);
    setCurrent(currentCooldown);
  }, [lastTick, kami]);

  const percent = total > 0 ? Math.min(100, Math.max(0, ((total - current) / total) * 100)) : 0;
  const color = getCooldownColor(percent);

  const cooldownBackground =
    current > 0 ? `conic-gradient(${color} ${percent}%, transparent ${percent}%)` : undefined;

  return (
    <TextTooltip key='cooldown' text={[`Cooldown: ${Math.round(current)}s`]}>
      <Wrapper>
        {React.Children.map(children, (child) => {
          if (child.type === React.Fragment) {
            return child;
          }
          return React.cloneElement(child, {
            cooldownBackground,
          });
        })}
      </Wrapper>
    </TextTooltip>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.3vw;
`;
