import { keyframes } from 'styled-components';

export const clickFx = (upscale = 1.05, downscale = 0.95) => keyframes`
  0% { transform: scale(${upscale}); }
  50% { transform: scale(${downscale}); }
  100% { transform: scale(${upscale}); }
`;

export const hoverFx = (upscale = 1.05) => keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(${upscale}); }
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
