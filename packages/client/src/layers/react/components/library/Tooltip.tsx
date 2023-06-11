import React from 'react';
import styled from 'styled-components';

interface TooltipProps {
  show: boolean;
  text: string;
  positionTop?: string;
}

export const TooltipContainer = styled.div<TooltipProps>`
  position: absolute;
  transform: translatey(10px) translateX(-40%);
  top: ${(props) => props.positionTop || '30px'};
  left: 50%;
  z-index: 2;
  padding: 5px;
  background-color: #ffffff;
  font-size: 12px;
  font-family: Pixel;
  opacity: ${(props) => (props.show ? 1 : 0)};
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  transition: all 0.3s ease-in-out;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
`;

export const Tooltip: React.FC<TooltipProps> = ({ show, text, positionTop }) => {
  return (
    <div style={{ position: 'relative' }}>
      <TooltipContainer show={show} text={text} positionTop={positionTop}>
        {text}
      </TooltipContainer>
    </div>
  );
};
