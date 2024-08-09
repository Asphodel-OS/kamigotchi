import { keyframes } from 'styled-components';

export const clickFx = (upscale = 1.05, downscale = 0.95, translate = 0) => keyframes`
  0% { transform: scale(${upscale}) translateX(${100 * translate}%); }
  50% { transform: scale(${downscale} translateX(${100 * translate}%); }
  100% { transform: scale(${upscale}) translateX(${100 * translate}%; }
`;

export const hoverFx = (upscale = 1.05, translate = 0) => keyframes`
  0% { transform: scale(1) translateX(${100 * translate}%); }
  100% { transform: scale(${upscale}) translateX(${100 * translate}%); }
`;

export const depressFx = (shift = 1, scale = 1) => keyframes`
  0% { 
    transform: scale(1); 
  }
  30% { 
    transform: scale(${scale}) translateY(${shift}vw);
    filter: drop-shadow(0 0 0 #bbb);
  }
  100% { 
    transform: scale(1); 
  }
`;

export const pulseFx = keyframes`
  0%, 80%, 90%, 100% {
    background-color: #ffffff;
  }
  85%, 95% {
    background-color: #e8e8e8;
  }
`;

export const glimmerFx = keyframes`
  0% {
    background-position: -100vw;
 
  }
  70% {
    background-position: 100vw;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  100% {
    background-position: 100vw;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;
