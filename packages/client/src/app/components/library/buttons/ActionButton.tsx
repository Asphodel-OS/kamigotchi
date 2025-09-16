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
      styles.fontSize = '.6rem';
      styles.padding = '.3rem .6rem';
      styles.borderRadius = '.3rem';
      styles.borderWidth = '.1rem';
    } else if (size === 'medium') {
      styles.fontSize = '.8rem';
      styles.padding = '.4rem .8rem';
      styles.height = '2.1rem';
      styles.borderRadius = '.45rem';
      styles.borderWidth = '.15rem';
    } else if (size === 'large') {
      styles.fontSize = '1.4rem';
      styles.padding = '.7rem 1.4rem';
      styles.borderRadius = '.7rem';
      styles.borderWidth = '.2rem';
    } else if (size === 'validator') {
      styles.fontSize = '1.2rem';
      styles.padding = '0.9rem';
      styles.borderRadius = '0.45rem';
      styles.borderWidth = '0.1rem';
    } else if (size === 'menu') {
      styles.fontSize = '0.9rem';
      styles.padding = '0rem .6rem';
      styles.borderRadius = '0.9rem';
      styles.borderWidth = '.15rem';
      styles.height = '4.5rem';
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
      styles.borderRadius = '0rem';
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
