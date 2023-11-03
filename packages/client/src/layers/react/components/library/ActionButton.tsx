import React from 'react';
import styled, { keyframes } from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  onClick: Function;
  text: string;
  disabled?: boolean;
  fill?: boolean;
  inverted?: boolean;
  size?: 'small' | 'medium' | 'large' | 'vending' | 'menu';
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const ActionButton = (props: Props) => {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await props.onClick();
  }

  // override styles for sizes and disabling
  const setStyles = () => {
    let styles: any = {};

    const size = props.size || 'medium';
    if (size === 'small') {
      styles.fontSize = '.6vw';
      styles.margin = '0vw .12vw';
      styles.padding = '.3vw .6vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.margin = '0vw .16vw';
      styles.padding = '.4vw .8vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.15vw';
    } else if (size === 'large') {
      styles.fontSize = '1.4vw';
      styles.margin = '0vw .28vw';
      styles.padding = '.7vw 1.4vw';
      styles.borderRadius = '.7vw';
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

  if (props.pulse) return (
    <PulseButton
      id={props.id}
      onClick={!props.disabled ? handleClick : () => { }}
      style={setStyles()}
    >
      {props.text}
    </PulseButton>
  );
  else return (
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
  border: solid black;

  color: black;
  justify-content: center;

  font-family: Pixel;
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

const Pulse = keyframes`
  0%, 80%, 90%, 100% {
    background-color: #ffffff;
  }
  85%, 95% {
    background-color: #e8e8e8;
  }
`

const PulseButton = styled(Button)`
  animation: ${Pulse} 3s ease-in-out infinite;
`;