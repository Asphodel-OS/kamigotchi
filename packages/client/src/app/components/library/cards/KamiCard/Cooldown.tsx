import React, { useEffect, useMemo, useState } from 'react';

import { calcCooldown, calcCooldownRequirement } from 'app/cache/kami';
import { onCooldown } from 'app/cache/kami/calcs/base';
import { CRTShader } from 'app/components/shaders/CRTShader';
import { ShaderStack } from 'app/components/shaders/ShaderStack';
import { makeStaticLayer } from 'app/components/shaders/StaticShader';
import { Kami } from 'network/shapes/Kami';
import { Countdown, TextTooltip } from '../..';

export const Cooldown = ({ kami }: { kami: Kami }) => {
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
  }, [kami]);

  // update the remaining time on the cooldown
  useEffect(() => {
    setCurrent(calcRemainingForVisuals());
  }, [lastRefresh, total, kami]);

  return (
    <TextTooltip key='cooldown' text={[`Cooldown: ${Math.round(current)}s`]}>
      <Countdown total={total} current={current} />
    </TextTooltip>
  );
};

// Hook to provide image filter and foreground shaders for cooldown visuals
export const useCooldownVisuals = (
  kami: Kami,
  enabled: boolean,
): { filter?: string; foreground?: React.ReactNode } => {
  const isOnCooldown = onCooldown(kami);
  const shouldAnimate = enabled && isOnCooldown;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!shouldAnimate) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 1000000), 200);
    return () => clearInterval(id);
  }, [shouldAnimate]);

  // Compute grayscale filter amount based on remaining/total cooldown
  const filter = useMemo(() => {
    if (!shouldAnimate) return undefined;
    const total = calcCooldownRequirement(kami);
    const rem = calcCooldown(kami);
    const progress = total > 0 ? Math.min(1, Math.max(0, rem / total)) : 0;
    const eased = Math.pow(progress, 1.25);
    const grayAmount = eased;
    return grayAmount > 0 ? `grayscale(${grayAmount}) contrast(1.05)` : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, tick, kami]);

  // Foreground shader overlay
  const foreground = useMemo(() => {
    if (!shouldAnimate) return undefined;

    const staticLayer: any = makeStaticLayer({ brightness: 1.6, alpha: 0.96, vertical: true });
    staticLayer.onBeforeFrame = (uniforms: any) => {
      const tot = calcCooldownRequirement(kami);
      const rem = calcCooldown(kami);
      const prog = tot > 0 ? Math.min(1, Math.max(0, rem / tot)) : 0;
      const eased = Math.pow(prog, 1.25);
      const alpha = 0.96 * eased;
      if (uniforms.uAlpha) uniforms.uAlpha.value = alpha;
    };

    const wipeLayer: any = makeStaticLayer({
      brightness: 1.7,
      alpha: 0.0,
      vertical: true,
      topFeather: 0.0,
      maskRadius: 0.0,
      maskHeight: 0.0,
    });
    wipeLayer.onBeforeFrame = (uniforms: any) => {
      const tot = calcCooldownRequirement(kami);
      const rem = calcCooldown(kami);
      const lastSecond = rem <= 1.0 && rem > 0; // only show while > 0 and <= 1s
      if (!lastSecond) {
        if (uniforms.uAlpha) uniforms.uAlpha.value = 0.0;
        return;
      }
      const timeIntoLast = Math.max(0, 1.0 - rem);
      const wait = 0.5;
      const dur = 0.5;
      const wp = Math.max(0, Math.min(1, (timeIntoLast - wait) / dur));
      const a = 0.9 * (1 - wp);
      if (uniforms.uTopSplit) uniforms.uTopSplit.value = 2.0;
      if (uniforms.uAlpha) uniforms.uAlpha.value = a;
    };

    return (
      <>
        <CRTShader brightness={1.6} alpha={0.96} />
        <ShaderStack layers={[staticLayer]} animateWhenOffscreen />
        <ShaderStack layers={[wipeLayer]} animateWhenOffscreen />
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, kami]);

  return { filter, foreground };
};
