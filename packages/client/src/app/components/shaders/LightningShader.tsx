import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderLayer } from './ShaderStack';

interface LightningShaderProps {
  intensity?: number; // 0..1 overall strength
  brightness?: number; // 0..2
  alpha?: number; // 0..1
  vertical?: boolean;
  paused?: boolean;
  // mask
  maskCenter?: { x: number; y: number };
  maskRadius?: number;
  maskHeight?: number;
  maskFeather?: number;
  cutoutOffset?: number;
  cutoutRadius?: number;
  topSplit?: number;
  topFeather?: number;
  // bob
  bobAmplitude?: number;
  bobFrequency?: number;
  bobPhase?: number;
  // background-aware tinting
  bgColor?: { r: number; g: number; b: number };
  bgTintMix?: number; // 0..1
}

// Lightning-like filaments inside the masked region
const LIGHTNING_FS = `
    precision mediump float;
    varying vec2 vUv;
    uniform float iTime; uniform vec3 iResolution;
    uniform float uIntensity, uBrightness, uAlpha, uVertical;
    uniform vec2 uMaskCenter; uniform float uMaskRadius, uMaskHeight, uMaskFeather;
    uniform float uCutoutOffset, uCutoutRadius;
    uniform float uTopSplit, uTopFeather;
    uniform float uBobAmp, uBobFreq, uBobPhase;
    uniform vec3 uBgColor; uniform float uBgTintMix;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=mat2(1.6,1.2,-1.2,1.6)*p+3.0; a*=0.55;} return v; }

    vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz), vec4(c.gb,K.xy), step(c.b,c.g));
      vec4 q=mix(vec4(p.xyw,c.r), vec4(c.r,p.yzx), step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1.0e-10;
      return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)), d/(q.x+e), q.x); }
    vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.,2./3.,1./3.,3.); vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www); return c.z*mix(K.xxx, clamp(p-K.xxx,0.,1.), c.y);} 

    float filament(vec2 p, float t){
      vec2 q = p*vec2(1.2, 2.0);
      q.y += 0.3*sin(3.0*q.x + t*2.0);
      float f = fbm(q + vec2(0.0, t*1.6));
      float g = abs(fract(f*4.0) - 0.5);
      return smoothstep(0.22, 0.0, g);
    }

    void main(){
      vec2 res=iResolution.xy; vec2 uv=(vUv*2.0-1.0); float aspect=res.x/max(res.y,1.0);
      if(uVertical>0.5) uv.x*=aspect; else { uv.y/=aspect; uv=uv.yx; }

      float bob = uBobAmp * sin(6.28318530718*uBobFreq*iTime + uBobPhase);
      vec2 uv01=vUv; float cx=uMaskCenter.x; float cy=uMaskCenter.y + bob; float r=uMaskRadius; float h=uMaskHeight; float f=max(uMaskFeather,0.0001);

      float d = length(uv01-vec2(cx,cy));
      float insideCircle = smoothstep(r+f, r-f, d);
      float belowCenter = smoothstep(-f, f, cy-uv01.y);
      float semiMask = insideCircle * belowCenter;
      float dx = abs(uv01.x-cx)-r; float insideX = smoothstep(0.0,f,-dx);
      float aboveBottom = smoothstep(-f, f, uv01.y - cy);
      float belowTop = smoothstep(-f, f, (cy+h)-uv01.y);
      float rectMask = insideX * aboveBottom * belowTop;
      float mask = clamp(max(semiMask, rectMask), 0.0, 1.0);
      float topMask = smoothstep(uTopSplit-uTopFeather, uTopSplit+uTopFeather, uv01.y);
      mask *= topMask;
      float faceD = length(uv01 - vec2(cx, cy - uCutoutOffset));
      float faceFade = smoothstep(0.0, uCutoutRadius, faceD);
      mask *= faceFade;

      float t=iTime; vec2 p = uv; 
      float l = 0.0;
      l += filament(p + vec2(0.0, 0.0), t);
      l += filament(p + vec2(0.35, 0.1), t*1.07);
      l += filament(p + vec2(-0.25, -0.05), t*0.91);
      l = clamp(l, 0.0, 1.0);
      float flicker = 0.7 + 0.3*sin(6.2831*(t*1.3));
      float val = l * flicker * uIntensity;

      vec3 cHSV = rgb2hsv(uBgColor);
      vec3 compHSV = vec3(fract(cHSV.x+0.5), cHSV.y, 1.0);
      vec3 compCol = hsv2rgb(compHSV);
      vec3 baseCol = vec3(1.0);
      vec3 tintCol = mix(baseCol, compCol, clamp(uBgTintMix,0.0,1.0));
      vec3 col = tintCol * (uBrightness * val);
      float a = uAlpha * val * mask;
      gl_FragColor = vec4(col, a);
    }
  `;

export const makeLightningLayer = (opts: Partial<LightningShaderProps> = {}): ShaderLayer => {
  const {
    intensity = 5.0,
    brightness = 1.6,
    alpha = 0.9,
    vertical = true,
    maskCenter = { x: 0.35, y: 1.0 },
    maskRadius = 0.3,
    maskHeight = 0.3,
    maskFeather = 0.1,
    cutoutOffset = 0.3,
    cutoutRadius = 0.28,
    topSplit = 0.6,
    topFeather = 0.1,
    bobAmplitude = 0.02,
    bobFrequency = 0.6,
    bobPhase = 0.0,
    bgColor,
    bgTintMix = 1.0,
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
    uBgColor: { value: new THREE.Vector3(bgColor?.r ?? 0.7, bgColor?.g ?? 0.9, bgColor?.b ?? 0.7) },
    uBgTintMix: { value: bgColor ? bgTintMix : 1.0 },
  };

  return { fragmentShader: LIGHTNING_FS, uniforms };
};

export const LightningShader: React.FC<Partial<LightningShaderProps>> = (props) => {
  const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform float iTime; uniform vec3 iResolution;
    uniform float uIntensity, uBrightness, uAlpha, uVertical;
    uniform vec2 uMaskCenter; uniform float uMaskRadius, uMaskHeight, uMaskFeather;
    uniform float uCutoutOffset, uCutoutRadius;
    uniform float uTopSplit, uTopFeather;
    uniform float uBobAmp, uBobFreq, uBobPhase;
    uniform vec3 uBgColor; uniform float uBgTintMix;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
      return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){ float v=0.0; float a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=mat2(1.6,1.2,-1.2,1.6)*p+3.0; a*=0.55;} return v; }

    vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz), vec4(c.gb,K.xy), step(c.b,c.g));
      vec4 q=mix(vec4(p.xyw,c.r), vec4(c.r,p.yzx), step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1.0e-10;
      return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)), d/(q.x+e), q.x); }
    vec3 hsv2rgb(vec3 c){ vec4 K=vec4(1.,2./3.,1./3.,3.); vec3 p=abs(fract(c.xxx+K.xyz)*6.-K.www); return c.z*mix(K.xxx, clamp(p-K.xxx,0.,1.), c.y);} 

    // Signed distance to a moving lightning filament
    float filament(vec2 p, float t){
      // warp the domain a bit
      vec2 q = p*vec2(1.2, 2.0);
      q.y += 0.3*sin(3.0*q.x + t*2.0);
      float f = fbm(q + vec2(0.0, t*1.6));
      // thin lines by thresholding fbm's derivative approximation
      float g = abs(fract(f*4.0) - 0.5);
      return smoothstep(0.22, 0.0, g); // sharper core
    }

    void main(){
      vec2 res=iResolution.xy; vec2 uv=(vUv*2.0-1.0); float aspect=res.x/max(res.y,1.0);
      if(uVertical>0.5) uv.x*=aspect; else { uv.y/=aspect; uv=uv.yx; }

      // bobbing
      float bob = uBobAmp * sin(6.28318530718*uBobFreq*iTime + uBobPhase);
      vec2 uv01=vUv; float cx=uMaskCenter.x; float cy=uMaskCenter.y + bob; float r=uMaskRadius; float h=uMaskHeight; float f=max(uMaskFeather,0.0001);

      float d = length(uv01-vec2(cx,cy));
      float insideCircle = smoothstep(r+f, r-f, d);
      float belowCenter = smoothstep(-f, f, cy-uv01.y);
      float semiMask = insideCircle * belowCenter;
      float dx = abs(uv01.x-cx)-r; float insideX = smoothstep(0.0,f,-dx);
      float aboveBottom = smoothstep(-f, f, uv01.y - cy);
      float belowTop = smoothstep(-f, f, (cy+h)-uv01.y);
      float rectMask = insideX * aboveBottom * belowTop;
      float mask = clamp(max(semiMask, rectMask), 0.0, 1.0);
      float topMask = smoothstep(uTopSplit-uTopFeather, uTopSplit+uTopFeather, uv01.y);
      mask *= topMask;
      // face fade
      float faceD = length(uv01 - vec2(cx, cy - uCutoutOffset));
      float faceFade = smoothstep(0.0, uCutoutRadius, faceD);
      mask *= faceFade;

      // lightning filaments (several layers)
      float t=iTime; vec2 p = uv; 
      float l = 0.0;
      l += filament(p + vec2(0.0, 0.0), t);
      l += filament(p + vec2(0.35, 0.1), t*1.07);
      l += filament(p + vec2(-0.25, -0.05), t*0.91);
      l = clamp(l, 0.0, 1.0);
      // time-based flicker
      float flicker = 0.7 + 0.3*sin(6.2831*(t*1.3));
      float val = l * flicker * uIntensity;

      // tint opposite of bg
      vec3 cHSV = rgb2hsv(uBgColor);
      vec3 compHSV = vec3(fract(cHSV.x+0.5), cHSV.y, 1.0);
      vec3 compCol = hsv2rgb(compHSV);
      vec3 baseCol = vec3(1.0); // white core
      vec3 tintCol = mix(baseCol, compCol, clamp(uBgTintMix,0.0,1.0));
      vec3 col = tintCol * (uBrightness * val);
      float a = uAlpha * val * mask;
      gl_FragColor = vec4(col, a);
    }
  `;

  const uniforms = makeLightningLayer(props).uniforms;
  return <ShaderCanvas fragmentShader={fragmentShader} uniforms={uniforms} transparent paused={props.paused} />;
};

export default LightningShader;

// Provide raw-layer factory for ShaderStack consumers
(LightningShader as any)._rawLayer = (shaped: number): ShaderLayer => {
  const intensity = Math.max(0.05, shaped);
  return makeLightningLayer({ intensity });
};


