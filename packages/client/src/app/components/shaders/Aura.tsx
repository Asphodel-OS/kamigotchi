import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShaderCanvas } from './ShaderCanvas';

interface AuraProps {
  intensity?: number; // 0..1
  hue?: number; // 0..1 (HSV hue)
  paused?: boolean;
}

// A soft pulsating ring with grain, intended as a general-purpose aura
export const Aura: React.FC<AuraProps> = ({ intensity = 0.9, hue = 0.92, paused }) => {
  const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform float iTime;
    uniform vec3 iResolution; // x,y,dpr
    uniform float uIntensity;
    uniform float uHue;

    // Hash and noise for subtle grain
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
                 mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
    }

    vec3 hsv2rgb(vec3 c){
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main(){
      vec2 uv = vUv * 2.0 - 1.0;
      uv.x *= iResolution.x / max(iResolution.y, 1.0);

      float r = length(uv);
      float ring = smoothstep(0.65, 0.25, r) - smoothstep(0.98, 0.75, r);

      float t = iTime;
      float pulse = 0.5 + 0.5 * sin(6.2831 * (t * 0.6 + r));
      float flicker = noise(uv * iResolution.xy * 0.015 + t * 0.5) * 0.2;

      float a = ring * (0.35 + 0.65 * pulse) * uIntensity + flicker * ring;

      vec3 col = hsv2rgb(vec3(uHue, 0.7, 1.0));
      vec3 glow = col * a;

      // soft vignette to focus center
      float vign = smoothstep(1.2, 0.4, r);
      glow *= vign;

      gl_FragColor = vec4(glow, a);
    }
  `;

  const uniforms: Record<string, THREE.IUniform> = {
    uIntensity: { value: intensity },
    uHue: { value: hue },
  };

  const intensityRef = useRef(intensity);
  const hueRef = useRef(hue);
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);
  useEffect(() => {
    hueRef.current = hue;
  }, [hue]);

  return (
    <ShaderCanvas
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      transparent
      paused={paused}
      onBeforeFrame={(u) => {
        if (u.uIntensity) u.uIntensity.value = intensityRef.current;
        if (u.uHue) u.uHue.value = hueRef.current;
      }}
    />
  );
};

export default Aura;


