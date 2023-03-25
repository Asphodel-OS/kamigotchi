import React from 'react';
import styled from 'styled-components';

export const ExitButton = (props: any) => {
  return <TopButton style={{ pointerEvents: 'auto' }} onClick={() => props.onClick()}>
    X
  </TopButton>
}

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