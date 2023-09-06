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

  return <Button onClick={handleClose}>
    X
  </Button>
}

const Button = styled.button`
  background-color: #ffffff;
  border-radius: .4vw;
  border: .15vw solid black;

  color: black;
  justify-self: right;
  padding: .3vw .4vw;
  margin: .7vw;
  z-index: 1;
  
  font-family: Pixel;
  font-size: .9vw;
  
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    background-color: #e8e8e8;
  }

  &:active {
    background-color: #c4c4c4;
  }
`;