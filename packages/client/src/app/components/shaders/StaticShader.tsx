import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderLayer } from './ShaderStack';

interface StaticShaderProps {
  intensity?: number; // overall effect strength
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
  // static tuning
  vertJerkOpt?: number;
  vertMovementOpt?: number;
  bottomStaticOpt?: number;
  scalinesOpt?: number;
  rgbOffsetOpt?: number;
  horzFuzzOpt?: number;
}

const STATIC_FS = `
  precision mediump float;
  varying vec2 vUv;
  uniform float iTime; uniform vec3 iResolution;
  uniform float uIntensity, uBrightness, uAlpha, uVertical;
  uniform vec2 uMaskCenter; uniform float uMaskRadius, uMaskHeight, uMaskFeather;
  uniform float uCutoutOffset, uCutoutRadius;
  uniform float uTopSplit, uTopFeather;
  uniform float uBobAmp, uBobFreq, uBobPhase;
  uniform float uVertJerkOpt, uVertMovementOpt, uBottomStaticOpt, uScanlinesOpt, uRgbOffsetOpt, uHorzFuzzOpt;

  // noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m*=m; m*=m;
    vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g);
  }
  float fnoise(vec2 v){ return fract(sin(dot(v, vec2(12.9898,78.233)))*43758.5453)*0.55; }

  float staticV(vec2 uv){
    float staticHeight=fnoise(vec2(9.0,iTime*1.2+3.0))*0.3+5.0;
    float staticAmount=fnoise(vec2(1.0,iTime*1.2-6.0))*0.1+0.3;
    float staticStrength=fnoise(vec2(-9.75,iTime*0.6-3.0))*2.0+2.0;
    return (1.0-step(fnoise(vec2(5.0*pow(iTime,2.0)+pow(uv.x*7.0,1.2), pow((mod(iTime,100.0)+100.0)*uv.y*0.3+3.0, staticHeight))), staticAmount))*staticStrength;
  }

  void main(){
    vec2 res=iResolution.xy; vec2 uv=vUv; vec2 fragCoord=uv*res;
    float aspect = res.x / max(res.y, 1.0);
    if(uVertical<0.5){ uv=vec2(uv.y,uv.x); }

    // vertical movement/jerk
    float vertMovementOn=(1.0-step(snoise(vec2(iTime*0.2,8.0)),0.4))*uVertMovementOpt;
    float vertJerk=(1.0-step(fnoise(vec2(iTime*1.5,5.0)),0.6))*uVertJerkOpt;
    float vertJerk2=(1.0-step(fnoise(vec2(iTime*5.5,5.0)),0.2))*uVertJerkOpt;
    float yOffset=abs(sin(iTime)*4.0)*vertMovementOn+vertJerk*vertJerk2*0.3;
    float y=mod(uv.y+yOffset,1.0);

    float fuzzOffset=fnoise(vec2(iTime*15.0,uv.y*80.0))*0.003;
    float largeFuzzOffset=fnoise(vec2(iTime*1.0,uv.y*25.0))*0.004;
    float xOffset=(fuzzOffset+largeFuzzOffset)*uHorzFuzzOpt;

    // accumulate vertical static from nearby rows
    float staticVal=0.0;
    for(float k=-1.0;k<=1.0;k+=1.0){
      float maxDist=5.0/200.0; float dist=k/200.0;
      staticVal+=staticV(vec2(uv.x,uv.y+dist))*(maxDist-abs(dist))*1.5;
    }
    staticVal*=uBottomStaticOpt;

    // generate base color (no iChannel0), emulate RGB offset by shifting phase
    float r = 0.5 + 0.5*staticVal + 0.01*uRgbOffsetOpt*sin(1000.0*(uv.y+y)+iTime);
    float g = 0.5 + 0.5*staticVal;
    float b = 0.5 + 0.5*staticVal - 0.01*uRgbOffsetOpt*sin(1000.0*(uv.y+y)+iTime*1.1);
    vec3 color = vec3(r,g,b);
    float scanline = sin(uv.y*800.0)*0.04*uScanlinesOpt;
    color = max(color - scanline, 0.0);

    // mask & bobbing (same as steam)
    float bob = uBobAmp * sin(6.28318530718*uBobFreq*iTime + uBobPhase);
    float cx=uMaskCenter.x; float cy=uMaskCenter.y + bob; float rads=uMaskRadius; float h=uMaskHeight; float f=max(uMaskFeather,0.0001);
    float d=length(uv-vec2(cx,cy));
    float insideCircle=smoothstep(rads+f, rads-f, d);
    float belowCenter=smoothstep(-f, f, cy-uv.y);
    float semiMask=insideCircle*belowCenter;
    float dx=abs(uv.x-cx)-rads; float insideX=smoothstep(0.0,f,-dx);
    float aboveBottom=smoothstep(-f, f, uv.y-cy);
    float belowTop=smoothstep(-f, f, (cy+h)-uv.y);
    float rectMask=insideX*aboveBottom*belowTop;
    float mask=clamp(max(semiMask,rectMask),0.0,1.0);
    float topMask=smoothstep(uTopSplit-uTopFeather, uTopSplit+uTopFeather, uv.y);
    mask*=topMask;
    float faceD=length(uv-vec2(cx, cy-uCutoutOffset));
    float faceFade=smoothstep(0.0, uCutoutRadius, faceD);
    mask*=faceFade;

    // Use the COMPLEMENT of the steam mask so static appears where smoke isn't
    float invMask = 1.0 - mask;
    vec3 col = color * (uBrightness * uIntensity);
    float a = uAlpha * uIntensity * invMask;
    gl_FragColor = vec4(col, a);
  }
`;

export const makeStaticLayer = (opts: Partial<StaticShaderProps> = {}): ShaderLayer => {
  const {
    intensity = 0.6,
    brightness = 1.0,
    alpha = 0.5,
    vertical = true,
    maskCenter = { x: 0.35, y: 1.0 },
    maskRadius = 0.6,
    maskHeight = 0.6,
    maskFeather = 0.06,
    cutoutOffset = 0.35,
    cutoutRadius = 0.35,
    topSplit = 0.6,
    topFeather = 0.12,
    bobAmplitude = 0.015,
    bobFrequency = 0.6,
    bobPhase = 0.0,
    vertJerkOpt = 1.0,
    vertMovementOpt = 1.0,
    bottomStaticOpt = 1.0,
    scalinesOpt = 2.0,
    rgbOffsetOpt = 1.0,
    horzFuzzOpt = 4.0,
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
    uVertJerkOpt: { value: vertJerkOpt },
    uVertMovementOpt: { value: vertMovementOpt },
    uBottomStaticOpt: { value: bottomStaticOpt },
    uScanlinesOpt: { value: scalinesOpt },
    uRgbOffsetOpt: { value: rgbOffsetOpt },
    uHorzFuzzOpt: { value: horzFuzzOpt },
  };

  return { fragmentShader: STATIC_FS, uniforms };
};

export const StaticShader: React.FC<Partial<StaticShaderProps>> = (props) => (
  <ShaderCanvas fragmentShader={STATIC_FS} uniforms={makeStaticLayer(props).uniforms} transparent paused={props.paused} />
);

export default StaticShader;


