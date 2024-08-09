import { keyframes } from 'styled-components';

export const clickFx = (scale = 0.05, translate = 0) => keyframes`
  0% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
  70% { transform: scale(${1 - scale} translateX(${100 * translate * (1 + scale)}%)); }
  100% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
`;

export const hoverFx = (scale = 0.05, translate = 0) => keyframes`
0% { transform: scale(1) translateX(${100 * translate}%); }
100% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
`;

export const depressFx = (shift = 1, scale = 0) => keyframes`
  0% { 
    transform: scale(1); 
  }
  30% { 
    transform: scale(${1 + scale}) translateY(${shift}vw);
    filter: drop-shadow(0 0 0 #bbb);
  }
  100% { 
    transform: scale(1); 
  }
`;

export const pulseFx = keyframes`
  0%, 80%, 90%, 100% {
    background-color: #fff;
  }
  85%, 95% {
    background-color: #ddd;
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
