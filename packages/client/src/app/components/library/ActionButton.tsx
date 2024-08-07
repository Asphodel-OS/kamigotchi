import styled, { keyframes } from 'styled-components';

import { playClick } from 'utils/sounds';
import { Tooltip } from './Tooltip';

interface Props {
  onClick: Function;
  text: string;
  disabled?: boolean;
  fill?: boolean;
  inverted?: boolean;
  size?: 'small' | 'medium' | 'large' | 'vending' | 'menu' | 'validator';
  pulse?: boolean;
  tooltip?: string[];
  noMargin?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const ActionButton = (props: Props) => {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await props.onClick();
  };

  // override styles for sizes and disabling
  const setStyles = () => {
    let styles: any = {};

    const size = props.size ?? 'medium';
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
    } else if (size === 'validator') {
      styles.fontSize = '1.2vh';
      styles.margin = '0vh .1vh';
      styles.padding = '0.9vh';
      styles.borderRadius = '0.45vh';
      styles.borderWidth = '0.1vh';
    } else if (size === 'vending') {
      styles.fontSize = '12px';
      styles.margin = '3px';
      styles.padding = '8px 24px';
      styles.borderRadius = '5px';
      styles.borderWidth = '2px';
    } else if (size === 'menu') {
      styles.fontSize = '0.9vh';
      styles.padding = '0vh .6vh';
      styles.borderRadius = '0.9vh';
      styles.borderWidth = '.15vw';
      styles.height = '4.5vh';
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
    if (props.noMargin) styles.margin = '0vw';
    return styles;
  };

  let result: JSX.Element;

  if (props.pulse)
    result = (
      <PulseButton onClick={!props.disabled ? handleClick : () => {}} style={setStyles()}>
        {props.text}
      </PulseButton>
    );
  else
    result = (
      <Button onClick={!props.disabled ? handleClick : () => {}} style={setStyles()}>
        {props.text}
      </Button>
    );

  if (props.tooltip) result = <Tooltip text={props.tooltip}>{result}</Tooltip>;

  return result;
};

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
`;

const PulseButton = styled(Button)`
  animation: ${Pulse} 3s ease-in-out infinite;
`;
