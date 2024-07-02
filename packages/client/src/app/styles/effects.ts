import { keyframes } from 'styled-components';

export const hoverFx = (upscale: number) => keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(${upscale}); }
`;

export const clickFx = (upscale: number, downscale = 0.95) => keyframes`
  0% { transform: scale(${upscale}); }
  50% { transform: scale(${downscale}); }
  100% { transform: scale(${upscale}); }
`;
