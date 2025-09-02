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
      styles.fontSize = '.6em';
      styles.padding = '.3em .6em';
      styles.borderRadius = '.3em';
      styles.borderWidth = '.1em';
    } else if (size === 'medium') {
      styles.fontSize = '.8em';
      styles.padding = '.4em .8em';
      styles.height = '2.1em';
      styles.borderRadius = '.45em';
      styles.borderWidth = '.15em';
    } else if (size === 'large') {
      styles.fontSize = '1.4em';
      styles.padding = '.7em 1.4em';
      styles.borderRadius = '.7em';
      styles.borderWidth = '.2em';
    } else if (size === 'validator') {
      styles.fontSize = '1.2em';
      styles.padding = '0.9em';
      styles.borderRadius = '0.45em';
      styles.borderWidth = '0.1em';
    } else if (size === 'menu') {
      styles.fontSize = '0.9em';
      styles.padding = '0em .6em';
      styles.borderRadius = '0.9em';
      styles.borderWidth = '.15em';
      styles.height = '4.5em';
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
      styles.borderRadius = '0em';
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
