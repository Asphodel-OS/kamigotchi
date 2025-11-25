import { useEffect, useState } from 'react';

import { calcCooldown, calcCooldownRequirement } from 'app/cache/kami';
import { Kami } from 'network/shapes/Kami';
import { CountdownCircle } from '../measures';
import { TextTooltip } from '../tooltips';

export const Cooldown = ({ kami }: { kami: Kami }) => {
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

  return (
    <TextTooltip key='cooldown' text={[`Cooldown: ${Math.round(current)}s`]}>
      <CountdownCircle total={total} current={current} />
    </TextTooltip>
  );
};
