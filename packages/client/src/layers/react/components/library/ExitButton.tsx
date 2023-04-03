import React from 'react';
import styled from 'styled-components';
import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  divName: string;
  position?: string;
}

// ExitButton is a rendering o fan exit button, which closes the modal it's on
export const ExitButton = (props: Props) => {
  const {
    visibleModals,
    setVisibleModals,
    sound: { volume },
  } = dataStore();

  // closes the modal this exit button is on
  const handleClose = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    setVisibleModals({ ...visibleModals, [props.divName]: false });
  };

  return <Button onClick={() => handleClose()}>
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
  margin: 10px 5px;
  width: 30px;
  
  font-family: Pixel;
  font-size: 14px;
  
  cursor: pointer;
  pointer-events: auto;

  &:active {
    background-color: #c2c2c2;
  }
`;