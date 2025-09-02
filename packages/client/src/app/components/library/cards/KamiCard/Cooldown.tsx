import React, { useEffect, useMemo, useState } from 'react';

import { Kami } from 'network/shapes/Kami';
import { calcCooldown, calcCooldownRequirement } from 'app/cache/kami';
import { onCooldown } from 'app/cache/kami/calcs/base';
import { makeCRTLayer } from 'app/components/shaders/CRTShader';
import { ShaderStack } from 'app/components/shaders/ShaderStack';
import { makeStaticLayer } from 'app/components/shaders/StaticShader';

import { Countdown, TextTooltip } from '../..';

const cooldownEndCache: Map<number | string, number> = new Map();

const getKamiCacheKey = (k: Kami) =>
  typeof (k as any).index === 'number'
    ? (k as any).index
    : ((k as any).id ?? `name:${(k as any).name || 'unknown'}`);

const calcRemainingFromCooldownOrCache = (k: Kami): number => {
  const now = Date.now() / 1000;
  const key = getKamiCacheKey(k);
  let end = Number((k as any).time?.cooldown);
  if (isFinite(end) && end > now) {
    cooldownEndCache.set(key, end);
  } else {
    const cached = cooldownEndCache.get(key);
    if (cached && cached > now) end = cached; else end = now;
  }
  return Math.max(0, end - now);
};

export const Cooldown = ({
  kami,
}: {
  kami: Kami;
}) => {
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

  const calcRemainingForVisuals = () => calcRemainingFromCooldownOrCache(kami);

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
  // visuals-only remaining time that prefers on-chain end timestamp, then cache
  const calcRemainingForVisuals = () => calcRemainingFromCooldownOrCache(kami);

  const remNow = calcRemainingForVisuals();
  const isOnCooldownVisual = remNow > 0;
  const shouldAnimate = enabled && isOnCooldownVisual;
  const [tick, setTick] = useState(0);
  const lastRemRef = React.useRef(remNow);
  const endAtRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (!shouldAnimate) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 1000000), 200);
    return () => clearInterval(id);
  }, [shouldAnimate]);

  // Track cooldown end to ensure a final wipe even if last-second window was missed
  useEffect(() => {
    const rem = calcRemainingForVisuals();
    const prev = lastRemRef.current;
    if (prev > 0 && rem === 0) endAtRef.current = performance.now() / 1000;
    lastRemRef.current = rem;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, kami]);

  // Compute grayscale filter amount based on remaining/total cooldown
  const filter = useMemo(() => {
    if (!shouldAnimate) return undefined;
    const total = calcCooldownRequirement(kami);
    const rem = calcRemainingForVisuals();
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
      const rem = calcRemainingForVisuals();
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
      const rem = calcRemainingForVisuals();
      const lastSecond = rem <= 1.0 && rem > 0; // while in final second

      let alpha = 0.0;
      if (lastSecond) {
        const timeIntoLast = Math.max(0, 1.0 - rem);
        const wait = 0.5;
        const dur = 0.5;
        const wp = Math.max(0, Math.min(1, (timeIntoLast - wait) / dur));
        alpha = 0.9 * (1 - wp);
      } else if (endAtRef.current != null) {
        // one-shot wipe for 0.5s after cooldown reaches 0
        const elapsed = performance.now() / 1000 - endAtRef.current;
        if (elapsed >= 0 && elapsed <= 0.5) {
          const wp = elapsed / 0.5;
          alpha = 0.9 * (1 - wp);
        } else {
          endAtRef.current = null;
        }
      }

      if (uniforms.uTopSplit) uniforms.uTopSplit.value = 2.0;
      if (uniforms.uAlpha) uniforms.uAlpha.value = alpha;
    };

    // Single WebGL context: CRT + static grain + final-second wipe
    const crtLayer = makeCRTLayer({ brightness: 1.6, alpha: 0.96 });
    return <ShaderStack layers={[crtLayer, staticLayer, wipeLayer]} animateWhenOffscreen />;
  }, [shouldAnimate, kami]);

  return { filter, foreground };
};
