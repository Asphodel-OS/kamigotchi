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
  const handleClick = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    props.onClick();
  }

  // override styles if disabled
  const overrideStyles = () => {
    var styles: any = {};
    if (props.disabled) styles.backgroundColor = '#a0a0a0';
    if (props.size === 'small') styles.fontSize = '10px';
    if (props.size === 'medium') {
      styles.fontSize = '14px';
      styles.margin = '3px';
      styles.padding = '5px 10px';
    }
    if (props.size === 'large') {
      styles.fontSize = '18px';
      styles.margin = '4px 2px';
      styles.padding = '15px 32px';
    }
    return styles;
  };

  return (
    <Button
      id={props.id}
      onClick={!props.disabled ? handleClick : () => { }}
      style={overrideStyles()}
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
  margin: 3px;
  padding: 5px 10px;

  justify-content: center;
  font-family: Pixel;
  font-size: 14px;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;

  &:active {
    background-color: #c2c2c2;
  }
`;