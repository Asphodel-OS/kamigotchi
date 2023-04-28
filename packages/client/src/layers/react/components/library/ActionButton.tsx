import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  id: string;
  onClick: Function;
  text: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// ActionButton is a text button that triggers an Action when clicked
export const ActionButton = (props: Props) => {
  const { sound: { volume } } = dataStore();

  // layer on a sound effect
  const handleClick = async () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    await props.onClick();
  }

  // override styles for sizes and disabling
  const setStyles = () => {
    var styles: any = {};

    const size = props.size || 'medium';
    if (size === 'small') {
      styles.fontSize = '10px';
      styles.margin = '2px';
      styles.padding = '3px 6px';
    } else if (size === 'medium') {
      styles.fontSize = '14px';
      styles.margin = '3px';
      styles.padding = '5px 10px';
    } else if (size === 'large') {
      styles.fontSize = '18px';
      styles.margin = '4px';
      styles.padding = '16px 32px';
    }

    if (props.disabled) styles.backgroundColor = '#b2b2b2';
    return styles;
  };

  return (
    <Button
      id={props.id}
      onClick={!props.disabled ? handleClick : () => { }}
      style={setStyles()}
    >
      {props.text}
    </Button>
  );
}

const Button = styled.button`
  background-color: #ffffff;
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  display: inline-block;

  justify-content: center;
  font-family: Pixel;
  font-size: 14px;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }
`;