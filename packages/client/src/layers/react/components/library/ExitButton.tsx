import React from 'react';
import styled from 'styled-components';

export const ExitButton = (props: any) => {
  return <Button onClick={() => props.onClick()}>
    X
  </Button>
}

const Button = styled.button`
  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;

  color: black;
  justify-self: right;
  padding: 5px;
  width: 30px;
  
  font-family: Pixel;
  font-size: 14px;
  
  cursor: pointer;
  pointer-events: auto;

  grid-column: 1;
  grid-row: 1;
  
  &:active {
    background-color: #c2c2c2;
  }
`;