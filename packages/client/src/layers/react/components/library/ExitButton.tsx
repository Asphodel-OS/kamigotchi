import React from 'react';
import styled from 'styled-components';

import clickSound from 'assets/sound/fx/mouseclick.wav';
import { useModalVisibility } from 'layers/react/hooks/useHandleModalVisibilty';


const ExitButton = (props: any) => {
  const { handleClick, visibleDiv } = useModalVisibility({
    soundUrl: clickSound,
    divName: props.divName,
    elementId: props.elementId,
  });

  return <TopButton style={{ pointerEvents: 'auto' }} onClick={handleClick}>
    X
  </TopButton>
}

export default ExitButton;

const TopButton = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  grid-column: 1;
  grid-row: 1;
  width: 30px;
  &:active {
    background-color: #c2c2c2;
  }
  justify-self: right;
`;