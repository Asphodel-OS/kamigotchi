import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderLayer } from './ShaderStack';

interface SteamShaderProps {
  speed?: number; // speed
  density?: number; // amount of wisps
  brightness?: number; // color brightness
  alpha?: number; // opacity
  hue?: number; // tint in HSV (used if no bgColor passed)
  vertical?: boolean; // orientation; default true
  paused?: boolean;
  // mask in vUv 0..1 space
  maskCenter?: { x: number; y: number };
  maskRadius?: number; // semicircle radius & rect half-width
  maskHeight?: number; // rectangle height
  maskFeather?: number; // edge softness
  // face cutout to avoid covering faces
  cutoutOffset?: number; // distance above maskCenter (toward top)
  cutoutRadius?: number; // radius of face hole
  // bobbing (applies to whole mask & face fade)
  bobAmplitude?: number; // vUv units (0..1)
  bobFrequency?: number; // cycles per second
  bobPhase?: number; // radians
  // top-half gradient mask
  topSplit?: number; // y in vUv (0 bottom .. 1 top), default 0.5
  topFeather?: number; // softness around split, default 0.08
  // background-aware tinting
  bgColor?: { r: number; g: number; b: number }; // 0..1 rgb
  bgTintMix?: number; // 0..1 mix of complementary-of-bg vs base hue
}

const STEAM_FS = `
    precision mediump float;
    varying vec2 vUv;
    uniform float iTime;
    uniform vec3 iResolution; // x,y,dpr
    uniform float uSpeed;
    uniform float uDensity;
    uniform float uBrightness;
    uniform float uAlpha;
    uniform float uHue;
    uniform float uVertical;
    uniform vec2 uMaskCenter;
    uniform float uMaskRadius;
    uniform float uMaskHeight;
    uniform float uMaskFeather;
    uniform float uCutoutOffset;
    uniform float uCutoutRadius;
    uniform float uBobAmp;
    uniform float uBobFreq;
    uniform float uBobPhase;
    uniform float uTopSplit;
    uniform float uTopFeather;
    uniform vec3 uBgColor;
    uniform float uBgTintMix; // 0..1

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
                 mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = mat2(1.6,1.2,-1.2,1.6) * p + 3.0;
        a *= 0.55;
      }
      return v;
    }

    // rgb<->hsv helpers
    vec3 rgb2hsv(vec3 c){
      vec4 K = vec4(0., -1./3., 2./3., -1.);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    vec3 hsv2rgb(vec3 c){
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main(){
      vec2 res = iResolution.xy;
      vec2 uv = (vUv * 2.0 - 1.0);
      float aspect = res.x / max(res.y, 1.0);
      if (uVertical > 0.5) { uv.x *= aspect; } else { uv.y /= aspect; uv = uv.yx; }

      float t = iTime * uSpeed;
      vec2 p = uv * vec2(1.0, 2.0) + vec2(0.0, -t * 1.5);
      float w1 = fbm(p * 1.25 + vec2(0.0, -t * 0.5));
      float w2 = fbm(p * 2.0 + vec2(2.3, -t * 0.8));
      float w3 = fbm(p * 3.0 + vec2(-1.7, -t * 0.3));
      float steam = (w1 * 0.6 + w2 * 0.3 + w3 * 0.1);
      float edgeSoft = smoothstep(1.15, 1.0, length(uv));
      steam *= mix(1.0, edgeSoft, 0.15);
      steam = pow(clamp(steam * (0.8 + 1.6 * uDensity), 0.0, 1.0), 1.25);
      steam *= 0.85 + 0.15 * sin(6.2831 * (t * 0.25 - uv.y * 0.5));

      float bob = uBobAmp * sin(6.28318530718 * uBobFreq * iTime + uBobPhase);

      vec2 uv01 = vUv;
      float cx = uMaskCenter.x;
      float cy = uMaskCenter.y + bob;
      float r = uMaskRadius;
      float h = uMaskHeight;
      float f = max(uMaskFeather, 0.0001);

      float d = length(uv01 - vec2(cx, cy));
      float insideCircle = smoothstep(r + f, r - f, d);
      float belowCenter = smoothstep(-f, f, cy - uv01.y);
      float semiMask = insideCircle * belowCenter;
      float dx = abs(uv01.x - cx) - r;
      float insideX = smoothstep(0.0, f, -dx);
      float aboveBottom = smoothstep(-f, f, uv01.y - cy);
      float belowTop = smoothstep(-f, f, (cy + h) - uv01.y);
      float rectMask = insideX * aboveBottom * belowTop;
      float mask = clamp(max(semiMask, rectMask), 0.0, 1.0);

      float topMask = smoothstep(uTopSplit - uTopFeather, uTopSplit + uTopFeather, uv01.y);
      mask *= topMask;

      vec2 faceC = vec2(cx, cy - uCutoutOffset);
      float faceD = length(uv01 - faceC);
      float faceFade = smoothstep(0.0, uCutoutRadius, faceD);
      mask *= faceFade;

      float distNorm = d / max(r, 1.0e-5);
      float gradCircle = 1.0 - smoothstep(0.2, 1.0, distNorm);
      float yDist = clamp((uv01.y - cy) / max(h, 1.0e-5), 0.0, 1.0);
      float gradRect = 1.0 - smoothstep(0.0, 1.0, yDist);
      float gradient = clamp(max(gradCircle, gradRect), 0.0, 1.0);

      // base hue color
      vec3 baseCol = hsv2rgb(vec3(uHue, 0.7, 1.0));
      // complementary of background color via HSV hue rotate 180 degrees
      vec3 bgHSV = rgb2hsv(uBgColor);
      vec3 compHSV = vec3(fract(bgHSV.x + 0.5), bgHSV.y, 1.0);
      vec3 compCol = hsv2rgb(compHSV);
      vec3 tintCol = mix(baseCol, compCol, clamp(uBgTintMix, 0.0, 1.0));

      vec3 col = tintCol * uBrightness;
      vec3 rgb = mix(vec3(0.0), col, steam * mask * gradient);
      float a = steam * uAlpha * mask * gradient;
      gl_FragColor = vec4(rgb, a);
    }
  `;

export const makeSteamLayer = (opts: Partial<SteamShaderProps> = {}): ShaderLayer => {
  const {
    speed = 1.65,
    density = 0.9,
    brightness = 2.0,
    alpha = 0.9,
    hue = 0.3,
    vertical = true,
    maskCenter = { x: 0.35, y: 1.2 },
    maskRadius = 0.65,
    maskHeight = 0.54,
    maskFeather = 0.04,
    cutoutOffset = 0.4,
    cutoutRadius = 0.4,
    bobAmplitude = 0.01,
    bobFrequency = 0.812,
    bobPhase = 0.1,
    topSplit = 0.7,
    topFeather = 0.12,
    bgColor,
    bgTintMix = 1.0,
  } = opts;

  const uniforms: Record<string, THREE.IUniform> = {
    uSpeed: { value: speed },
    uDensity: { value: density },
    uBrightness: { value: brightness },
    uAlpha: { value: alpha },
    uHue: { value: hue },
    uVertical: { value: vertical ? 1.0 : 0.0 },
    uMaskCenter: { value: new THREE.Vector2(maskCenter.x, maskCenter.y) },
    uMaskRadius: { value: maskRadius },
    uMaskHeight: { value: maskHeight },
    uMaskFeather: { value: maskFeather },
    uCutoutOffset: { value: cutoutOffset },
    uCutoutRadius: { value: cutoutRadius },
    uBobAmp: { value: bobAmplitude },
    uBobFreq: { value: bobFrequency },
    uBobPhase: { value: bobPhase },
    uTopSplit: { value: topSplit },
    uTopFeather: { value: topFeather },
    uBgColor: { value: new THREE.Vector3(bgColor?.r ?? 0.7, bgColor?.g ?? 0.9, bgColor?.b ?? 0.7) },
    uBgTintMix: { value: bgColor ? bgTintMix : 0.0 },
  };

  return { fragmentShader: STEAM_FS, uniforms };
};

export const SteamShader: React.FC<SteamShaderProps> = ({
  speed = 1.65,
  density = 0.90,
  brightness = 2.0,
  alpha = 0.9,
  hue = 0.3,
  vertical = true,
  paused,
  maskCenter = { x: 0.35, y: 1.2 },
  maskRadius = 0.65,
  maskHeight = 0.54,
  maskFeather = 0.04,
  cutoutOffset = 0.40,
  cutoutRadius = 0.4,
  bobAmplitude = 0.01,
  bobFrequency = 0.812,
  bobPhase = 0.1,
  topSplit = 0.7,
  topFeather = 0.12,
  bgColor,
  bgTintMix = 1.0,
}) => {
  const fragmentShader = STEAM_FS;

  const uniforms: Record<string, THREE.IUniform> = {
    uSpeed: { value: speed },
    uDensity: { value: density },
    uBrightness: { value: brightness },
    uAlpha: { value: alpha },
    uHue: { value: hue },
    uVertical: { value: vertical ? 1.0 : 0.0 },
    uMaskCenter: { value: new THREE.Vector2(maskCenter.x, maskCenter.y) },
    uMaskRadius: { value: maskRadius },
    uMaskHeight: { value: maskHeight },
    uMaskFeather: { value: maskFeather },
    uCutoutOffset: { value: cutoutOffset },
    uCutoutRadius: { value: cutoutRadius },
    uBobAmp: { value: bobAmplitude },
    uBobFreq: { value: bobFrequency },
    uBobPhase: { value: bobPhase },
    uTopSplit: { value: topSplit },
    uTopFeather: { value: topFeather },
    uBgColor: { value: new THREE.Vector3(bgColor?.r ?? 0.7, bgColor?.g ?? 0.9, bgColor?.b ?? 0.7) },
    uBgTintMix: { value: bgColor ? bgTintMix : 0.0 },
  };

  const speedRef = useRef(speed);
  const densityRef = useRef(density);
  const brightnessRef = useRef(brightness);
  const alphaRef = useRef(alpha);
  const hueRef = useRef(hue);
  const verticalRef = useRef(vertical);
  const maskCenterRef = useRef(maskCenter);
  const maskRadiusRef = useRef(maskRadius);
  const maskHeightRef = useRef(maskHeight);
  const maskFeatherRef = useRef(maskFeather);
  const cutoutOffsetRef = useRef(cutoutOffset);
  const cutoutRadiusRef = useRef(cutoutRadius);
  const bobAmpRef = useRef(bobAmplitude);
  const bobFreqRef = useRef(bobFrequency);
  const bobPhaseRef = useRef(bobPhase);
  const topSplitRef = useRef(topSplit);
  const topFeatherRef = useRef(topFeather);
  const bgColorRef = useRef(bgColor);
  const bgTintMixRef = useRef(bgTintMix);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { densityRef.current = density; }, [density]);
  useEffect(() => { brightnessRef.current = brightness; }, [brightness]);
  useEffect(() => { alphaRef.current = alpha; }, [alpha]);
  useEffect(() => { hueRef.current = hue; }, [hue]);
  useEffect(() => { verticalRef.current = vertical; }, [vertical]);
  useEffect(() => { maskCenterRef.current = maskCenter; }, [maskCenter]);
  useEffect(() => { maskRadiusRef.current = maskRadius; }, [maskRadius]);
  useEffect(() => { maskHeightRef.current = maskHeight; }, [maskHeight]);
  useEffect(() => { maskFeatherRef.current = maskFeather; }, [maskFeather]);
  useEffect(() => { cutoutOffsetRef.current = cutoutOffset; }, [cutoutOffset]);
  useEffect(() => { cutoutRadiusRef.current = cutoutRadius; }, [cutoutRadius]);
  useEffect(() => { bobAmpRef.current = bobAmplitude; }, [bobAmplitude]);
  useEffect(() => { bobFreqRef.current = bobFrequency; }, [bobFrequency]);
  useEffect(() => { bobPhaseRef.current = bobPhase; }, [bobPhase]);
  useEffect(() => { topSplitRef.current = topSplit; }, [topSplit]);
  useEffect(() => { topFeatherRef.current = topFeather; }, [topFeather]);
  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);
  useEffect(() => { bgTintMixRef.current = bgTintMix; }, [bgTintMix]);

  return (
    <ShaderCanvas
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent
      paused={paused}
      onBeforeFrame={(u) => {
        if (u.uSpeed) u.uSpeed.value = speedRef.current;
        if (u.uDensity) u.uDensity.value = densityRef.current;
        if (u.uBrightness) u.uBrightness.value = brightnessRef.current;
        if (u.uAlpha) u.uAlpha.value = alphaRef.current;
        if (u.uHue) u.uHue.value = hueRef.current;
        if (u.uVertical) u.uVertical.value = verticalRef.current ? 1.0 : 0.0;
        if (u.uMaskCenter) {
          const c = maskCenterRef.current;
          u.uMaskCenter.value.set(c.x, c.y);
        }
        if (u.uMaskRadius) u.uMaskRadius.value = maskRadiusRef.current;
        if (u.uMaskHeight) u.uMaskHeight.value = maskHeightRef.current;
        if (u.uMaskFeather) u.uMaskFeather.value = maskFeatherRef.current;
        if (u.uCutoutOffset) u.uCutoutOffset.value = cutoutOffsetRef.current;
        if (u.uCutoutRadius) u.uCutoutRadius.value = cutoutRadiusRef.current;
        if (u.uBobAmp) u.uBobAmp.value = bobAmpRef.current;
        if (u.uBobFreq) u.uBobFreq.value = bobFreqRef.current;
        if (u.uBobPhase) u.uBobPhase.value = bobPhaseRef.current;
        if (u.uTopSplit) u.uTopSplit.value = topSplitRef.current;
        if (u.uTopFeather) u.uTopFeather.value = topFeatherRef.current;
        if (u.uBgColor) {
          const bg = bgColorRef.current ?? { r: 0.7, g: 0.9, b: 0.7 };
          u.uBgColor.value.set(bg.r, bg.g, bg.b);
        }
        if (u.uBgTintMix) u.uBgTintMix.value = bgTintMixRef.current ?? 0.0;
      }}
    />
  );
};

export default SteamShader;

// Provide raw-layer factory for ShaderStack consumers
(SteamShader as any)._rawLayer = (shaped: number): ShaderLayer => {
  const density = 0.05 + 1.95 * shaped;
  const alpha = (0.2 + 0.8 * shaped) * 0.8;
  return makeSteamLayer({ density, alpha });
};


