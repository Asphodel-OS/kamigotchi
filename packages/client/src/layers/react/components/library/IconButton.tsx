import React from 'react';
import styled, { css, keyframes } from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  onClick: Function;
  img: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = (props: Props) => {
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
      styles.margin = '.15vw';
      styles.padding = '.3vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.09vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.margin = '.2vw';
      styles.padding = '.4vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.12vw';
    } else if (size === 'large') {
      styles.fontSize = '1.4vw';
      styles.margin = '.35vw';
      styles.padding = '.7vw';
      styles.borderRadius = '.7vw';
      styles.borderWidth = '.21vw';
    }

    if (props.disabled) styles.backgroundColor = '#b2b2b2';

    return styles;
  };

  if (props.pulse) return (
    <PulseButton
      id={props.id}
      onClick={!props.disabled ? handleClick : () => { }}
      style={setStyles()}
    >
      <Image src={props.img} />
    </PulseButton>
  );
  else return (
    <Button
      id={props.id}
      onClick={!props.disabled ? handleClick : () => { }}
      style={setStyles()}
    >
      <Image src={props.img} />
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

const Image = styled.img`
  width: 1.4vw;
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