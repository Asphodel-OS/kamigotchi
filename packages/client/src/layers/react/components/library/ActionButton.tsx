import React from 'react';
import styled from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';

interface Props {
  id: string;
  onClick: Function;
  text: string;
  disabled?: boolean;
  fill?: boolean;
  inverted?: boolean;
  size?: 'small' | 'medium' | 'large' | 'vending' | 'menu';
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
      styles.fontSize = '.7vw';
      styles.margin = '.14vw';
      styles.padding = '.21vw .42vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.fontSize = '1vw';
      styles.margin = '.21vw';
      styles.padding = '.35vw .7vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.15vw';
    } else if (size === 'large') {
      styles.fontSize = '1.4vw';
      styles.margin = '.28vw';
      styles.padding = '1.1vw 2.2vw';
      styles.borderRadius = '.5vw';
      styles.borderWidth = '.2vw';
    } else if (size === 'vending') {
      styles.fontSize = '12px';
      styles.margin = '3px';
      styles.padding = '8px 24px';
      styles.borderRadius = '5px';
      styles.borderWidth = '2px';
    } else if (size === 'menu') {
      styles.fontSize = '10px';
      styles.margin = '0px';
      styles.padding = '3px 6px';
      styles.borderRadius = '10px';
      styles.borderWidth = '1px';
      styles.height = '36px';
    }

    if (props.inverted) {
      styles.backgroundColor = '#111';
      styles.borderColor = 'white';
      styles.color = 'white';
      if (props.disabled) styles.backgroundColor = '#4d4d4d';
    } else {
      if (props.disabled) styles.backgroundColor = '#b2b2b2';
    }

    if (props.fill) styles.flexGrow = '1';
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
  border-style: solid;
  color: black;

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