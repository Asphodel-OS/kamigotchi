import React from 'react';
import styled, { css, keyframes } from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  onClick: Function;
  img: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large' | 'book';
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = (props: Props) => {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await props.onClick();
  };

  // override styles for sizes and disabling
  const setStyles = () => {
    let styles: any = {};

    const size = props.size || 'medium';
    if (size === 'small') {
      styles.width = '1.5vw';
      styles.height = '1.5vw';
      styles.margin = '.1vw';
      styles.padding = '.1vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.width = '2.5vw';
      styles.height = '2.5vw';
      styles.margin = '.2vw';
      styles.padding = '.2vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.15vw';
    } else if (size === 'large') {
      styles.width = '4vw';
      styles.height = '4vw';
      styles.margin = '.35vw';
      styles.padding = '.7vw';
      styles.borderRadius = '.7vw';
      styles.borderWidth = '.2vw';
    } else if (size === 'book') {
      // this is tweeked specfically for the help menu
      styles.width = '8vw';
      styles.height = '10vw';
      styles.margin = '.5vw';
      styles.padding = '.5vw';
      styles.borderRadius = '1vw';
      styles.borderWidth = '.25vw';
      styles.boxShadow = '0 0 1vw 0 rgba(0, 0, 0, 0.5)';
    }

    if (props.disabled) styles.backgroundColor = '#b2b2b2';

    return styles;
  };

  if (props.pulse)
    return (
      <PulseButton
        id={props.id}
        onClick={!props.disabled ? handleClick : () => {}}
        style={setStyles()}
      >
        <Image src={props.img} />
      </PulseButton>
    );
  else
    return (
      <Button
        id={props.id}
        onClick={!props.disabled ? handleClick : () => {}}
        style={setStyles()}
      >
        <Image src={props.img} />
      </Button>
    );
};

const Button = styled.div`
  background-color: #ffffff;
  border: solid black;

  color: black;
  justify-content: center;

  font-family: Pixel;
  text-align: center;

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
  width: 100%;
`;

const Pulse = keyframes`
  0%, 80%, 90%, 100% {
    background-color: #ffffff;
  }
  85%, 95% {
    background-color: #e8e8e8;
  }
`;

const PulseButton = styled(Button)`
  animation: ${Pulse} 3s ease-in-out infinite;
`;
