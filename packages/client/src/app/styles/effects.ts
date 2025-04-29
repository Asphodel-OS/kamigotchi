import styled, { keyframes } from 'styled-components';

// bounce animation on click (typically used with hoverFx)
export const clickFx = (scale = 0.05, translate = 0) => keyframes`
  0% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
  70% { transform: scale(${1 - scale} translateX(${100 * translate * (1 + scale)}%)); }
  100% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
`;

// grow animation on hover
export const hoverFx = (scale = 0.05, translate = 0) => keyframes`
0% { transform: scale(1) translateX(${100 * translate}%); }
100% { transform: scale(${1 + scale}) translateX(${100 * translate * (1 - scale)}%); }
`;

// depress animation used for 3D button click effects
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

// flicker-like pulse animation
export const pulseFx = keyframes`
  0%, 80%, 90%, 100% {
    background-color: #fff;
  }
  85%, 95% {
    background-color: #ddd;
  }
`;

// radial gradient animation, grows outward and fades over time
export const radiateFx = keyframes`
  0% {
    transform: scale(1);
    opacity: 0;
  }
  20% {
    transform: scale(1.2);
    opacity: .2;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
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

export const Spin = keyframes` 
  100% { 
    transform: rotateZ(360deg); 
  }
`;
