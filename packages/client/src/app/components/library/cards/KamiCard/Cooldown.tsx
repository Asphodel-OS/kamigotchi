import { calcCooldown, calcCooldownRequirement } from 'app/cache/kami';
import { Kami } from 'network/shapes/Kami';
import { useEffect, useState } from 'react';
import { Countdown, Tooltip } from '../..';

interface Props {
  kami: Kami;
}

export const Cooldown = (props: Props) => {
  const { kami } = props;

  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);

  // ticking and setting total cooldown
  useEffect(() => {
    const total = calcCooldownRequirement(kami);
    setTotal(total);

    const refreshClock = () => setLastRefresh(Date.now());
    const timerId = setInterval(refreshClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  // update the remaining time on the cooldown
  useEffect(() => {
    setCurrent(calcCooldown(kami));
  }, [lastRefresh, total]);

  return (
    <Tooltip key='cooldown' text={[`Cooldown: ${Math.round(current)}s`]}>
      <Countdown total={total} current={current} />
    </Tooltip>
  );
};
