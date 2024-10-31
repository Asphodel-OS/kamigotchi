import styled, { keyframes } from 'styled-components';

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

export const Shimmer = styled.div`
  height: 90%;
  width: 90%;
  border-bottom-right-radius: 3px;
  background: linear-gradient(45deg, #0000 40%, #fafafa 50%, #0000 60%);
  position: absolute;
  z-index: -5;
  animation: shimmer 3s infinite both;
  background-size: 500%;
  animation-timing-function: ease-in-out;
  @keyframes shimmer {
    0% {
      background-position-x: 100%;
    }
    3% {
      background-position-x: 70%;
    }

    6% {
      background-position-x: 40%;
    }
    9% {
      background-position-x: 10%;
    }
  }
`;
