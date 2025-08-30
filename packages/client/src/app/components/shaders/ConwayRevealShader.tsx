import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderLayer } from './ShaderStack';

interface ConwayRevealShaderProps {
  intensity?: number; // 0..1 cooldown progress (0 = fully revealed, 1 = fully occluded)
  brightness?: number; // color brightness
  alpha?: number; // opacity
  vertical?: boolean;
  paused?: boolean;
  // mask in vUv space
  maskCenter?: { x: number; y: number };
  maskRadius?: number;
  maskHeight?: number;
  maskFeather?: number;
  cutoutOffset?: number;
  cutoutRadius?: number;
  topSplit?: number;
  topFeather?: number;
  bobAmplitude?: number;
  bobFrequency?: number;
  bobPhase?: number;
  // Conway parameters
  gridSize?: number; // resolution of Conway grid (higher = more detailed)
  generations?: number; // max generations to simulate
  seed?: number; // random seed for initial pattern
}

const CONWAY_FS = `
  precision mediump float;
  varying vec2 vUv;
  uniform float iTime; uniform vec3 iResolution;
  uniform float uIntensity, uBrightness, uAlpha, uVertical;
  uniform vec2 uMaskCenter; uniform float uMaskRadius, uMaskHeight, uMaskFeather;
  uniform float uCutoutOffset, uCutoutRadius;
  uniform float uTopSplit, uTopFeather;
  uniform float uBobAmp, uBobFreq, uBobPhase;
  uniform float uGridSize, uGenerations, uSeed;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  
  float getCell(vec2 gridPos, float generation) {
    vec2 wrappedPos = mod(gridPos, uGridSize);
    float cellHash = hash(wrappedPos + vec2(uSeed, generation * 0.1));
    
    if (generation < 0.5) {
      return step(0.6, cellHash); // ~40% initial alive cells
    }
    
  
    float noise = hash(wrappedPos + vec2(generation * 0.33, uSeed));
    float cyclicPattern = sin(generation * 0.5 + wrappedPos.x + wrappedPos.y) * 0.5 + 0.5;
    return step(0.4 + 0.3 * noise, cyclicPattern);
  }
  
  float countNeighbors(vec2 gridPos, float generation) {
    float count = 0.0;
    for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
      for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
        if (abs(dx) + abs(dy) > 0.5) { // exclude center cell
          count += getCell(gridPos + vec2(dx, dy), generation);
        }
      }
    }
    return count;
  }
  
  float conwayStep(vec2 gridPos, float generation) {
    float currentState = getCell(gridPos, generation);
    float neighbors = countNeighbors(gridPos, generation);
    

    if (currentState > 0.5) {
      return (neighbors >= 1.5 && neighbors <= 3.5) ? 1.0 : 0.0;
    } else {
      return (neighbors >= 2.5 && neighbors <= 3.5) ? 1.0 : 0.0;
    }
  }

  void main(){
    vec2 res = iResolution.xy;
    vec2 uv = vUv;
    float aspect = res.x / max(res.y, 1.0);
    if (uVertical < 0.5) { uv = vec2(uv.y, uv.x); }

    vec2 gridPos = floor(uv * uGridSize);
    
    float currentGen = floor(uIntensity * uGenerations);
    
    float cellAlive = conwayStep(gridPos, currentGen);
    
    vec2 pixelUV = (floor(uv * uGridSize) + 0.5) / uGridSize;
    float pixelAlive = conwayStep(floor(pixelUV * uGridSize), currentGen);
    
    float bob = uBobAmp * sin(6.28318530718 * uBobFreq * iTime + uBobPhase);
    float cx = uMaskCenter.x; float cy = uMaskCenter.y + bob;
    float r = uMaskRadius; float h = uMaskHeight; float f = max(uMaskFeather, 0.0001);
    float d = length(uv - vec2(cx, cy));
    float insideCircle = smoothstep(r + f, r - f, d);
    float belowCenter = smoothstep(-f, f, cy - uv.y);
    float semiMask = insideCircle * belowCenter;
    float dx = abs(uv.x - cx) - r; float insideX = smoothstep(0.0, f, -dx);
    float aboveBottom = smoothstep(-f, f, uv.y - cy);
    float belowTop = smoothstep(-f, f, (cy + h) - uv.y);
    float rectMask = insideX * aboveBottom * belowTop;
    float mask = clamp(max(semiMask, rectMask), 0.0, 1.0);
    float faceD = length(uv - vec2(cx, cy - uCutoutOffset));
    float faceFade = smoothstep(0.0, uCutoutRadius, faceD);
    mask *= faceFade;
    float reveal = pixelAlive * (1.0 - uIntensity); // Invert: high intensity = less reveal
    
    vec3 occlusionColor = vec3(0.0, 0.0, 0.0); // Pure black occlusion
    vec3 col = occlusionColor * uBrightness;
    float a = uAlpha * (1.0 - reveal) * mask; // Hide where NOT revealed
    
    gl_FragColor = vec4(col, a);
  }
`;

export const makeConwayRevealLayer = (opts: Partial<ConwayRevealShaderProps> = {}): ShaderLayer => {
  const {
    intensity = 0.8,
    brightness = 1.0,
    alpha = 0.9,
    vertical = true,
    maskCenter = { x: 0.35, y: 1.0 },
    maskRadius = 0.90,
    maskHeight = 0.54,
    maskFeather = 0.14,
    cutoutOffset = 0.40,
    cutoutRadius = 0.24,
    topSplit = 0.7,
    topFeather = 0.12,
    bobAmplitude = 0.035,
    bobFrequency = 0.7,
    bobPhase = 0.0,
    gridSize = 32.0,
    generations = 20.0,
    seed = 42.0,
  } = opts;

  const uniforms: Record<string, THREE.IUniform> = {
    uIntensity: { value: intensity },
    uBrightness: { value: brightness },
    uAlpha: { value: alpha },
    uVertical: { value: vertical ? 1.0 : 0.0 },
    uMaskCenter: { value: new THREE.Vector2(maskCenter.x, maskCenter.y) },
    uMaskRadius: { value: maskRadius },
    uMaskHeight: { value: maskHeight },
    uMaskFeather: { value: maskFeather },
    uCutoutOffset: { value: cutoutOffset },
    uCutoutRadius: { value: cutoutRadius },
    uTopSplit: { value: topSplit },
    uTopFeather: { value: topFeather },
    uBobAmp: { value: bobAmplitude },
    uBobFreq: { value: bobFrequency },
    uBobPhase: { value: bobPhase },
    uGridSize: { value: gridSize },
    uGenerations: { value: generations },
    uSeed: { value: seed },
  };

  return { fragmentShader: CONWAY_FS, uniforms };
};

export const ConwayRevealShader: React.FC<ConwayRevealShaderProps> = (props) => {
  const layer = makeConwayRevealLayer(props);

  const uniforms = layer.uniforms ?? {};
  const refs = {
    intensityRef: useRef(props.intensity ?? 0.8),
    brightnessRef: useRef(props.brightness ?? 1.0),
    alphaRef: useRef(props.alpha ?? 0.9),
  };
  useEffect(() => { refs.intensityRef.current = props.intensity ?? 0.8; }, [props.intensity]);
  useEffect(() => { refs.brightnessRef.current = props.brightness ?? 1.0; }, [props.brightness]);
  useEffect(() => { refs.alphaRef.current = props.alpha ?? 0.9; }, [props.alpha]);

  return (
    <ShaderCanvas
      fragmentShader={CONWAY_FS}
      uniforms={uniforms}
      transparent
      paused={props.paused}
      onBeforeFrame={(u) => {
        if (u.uIntensity) u.uIntensity.value = refs.intensityRef.current;
        if (u.uBrightness) u.uBrightness.value = refs.brightnessRef.current;
        if (u.uAlpha) u.uAlpha.value = refs.alphaRef.current;
      }}
    />
  );
};

export default ConwayRevealShader;
