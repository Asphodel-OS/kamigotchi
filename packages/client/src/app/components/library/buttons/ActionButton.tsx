import styled from 'styled-components';

import { pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';
import { TextTooltip } from '../poppers/TextTooltip';

// ActionButton is a text button that triggers an Action when clicked
export const ActionButton = ({
  onClick,
  text,
  disabled = false,
  fill = false,
  inverted = false,
  size = 'medium',
  pulse = false,
  tooltip,
  noBorder = false,
}: {
  onClick: Function;
  text: string;
  disabled?: boolean;
  fill?: boolean;
  inverted?: boolean;
  size?: 'small' | 'medium' | 'large' | 'menu' | 'validator';
  pulse?: boolean;
  tooltip?: string[];
  noBorder?: boolean;
}) => {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  // override styles for sizes and disabling
  const setStyles = () => {
    const styles: any = {};

    if (size === 'small') {
      styles.fontSize = '.6vw';
      styles.padding = '.3vw .6vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.padding = '.4vw .8vw';
      styles.height = '2.1vw';
      styles.borderRadius = '.45vw';
      styles.borderWidth = '.15vw';
    } else if (size === 'large') {
      styles.fontSize = '1.4vw';
      styles.padding = '.7vw 1.4vw';
      styles.borderRadius = '.7vw';
      styles.borderWidth = '.2vw';
    } else if (size === 'validator') {
      styles.fontSize = '1.2vh';
      styles.padding = '0.9vh';
      styles.borderRadius = '0.45vh';
      styles.borderWidth = '0.1vh';
    } else if (size === 'menu') {
      styles.fontSize = '0.9vh';
      styles.padding = '0vh .6vh';
      styles.borderRadius = '0.9vh';
      styles.borderWidth = '.15vw';
      styles.height = '4.5vh';
    }

    if (inverted) {
      styles.backgroundColor = '#111';
      styles.borderColor = 'white';
      styles.color = 'white';
      if (disabled) styles.backgroundColor = '#4d4d4d';
    } else {
      if (disabled) styles.backgroundColor = '#b2b2b2';
    }

    if (fill) styles.flexGrow = '1';
    if (noBorder) {
      styles.border = 'none';
      styles.borderRadius = '0vw';
    }
    return styles;
  };

  let result: JSX.Element;

  if (pulse)
    result = (
      <PulseButton onClick={!disabled ? handleClick : () => {}} style={setStyles()}>
        {text}
      </PulseButton>
    );
  else
    result = (
      <Button onClick={!disabled ? handleClick : () => {}} style={setStyles()}>
        {text}
      </Button>
    );

  if (tooltip) result = <TextTooltip text={tooltip}>{result}</TextTooltip>;

  return result;
};

const Button = styled.button`
  background-color: #ffffff;
  border: solid black;

  color: black;
  display: flex;
  justify-content: center;
  align-items: center;

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

const PulseButton = styled(Button)`
  animation: ${pulseFx} 3s ease-in-out infinite;
`;
