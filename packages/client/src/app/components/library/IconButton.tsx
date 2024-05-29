import styled, { keyframes } from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  onClick: Function;
  img: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large' | 'book';
  color?: string;
  pulse?: boolean;
  noMargin?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = (props: Props) => {
  const { onClick, img, disabled, color, pulse, noMargin } = props;

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  // override styles for sizes and disabling
  const setStyles = () => {
    let styles: any = {};

    const size = props.size ?? 'medium';
    if (size === 'small') {
      styles.width = '1.5vw';
      styles.height = '1.5vw';
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

    if (noMargin) styles.margin = '0vw';
    if (color) styles.backgroundColor = color;
    if (disabled) styles.backgroundColor = '#b2b2b2';

    return styles;
  };

  return (
    <Button
      onClick={!disabled ? handleClick : () => {}}
      style={setStyles()}
      color={color}
      disabled={disabled}
      pulse={pulse}
    >
      <Image src={img} />
    </Button>
  );
};

const Button = styled.div<{ color?: string; disabled?: boolean; pulse?: boolean }>`
  border: solid black;
  justify-content: center;

  font-family: Pixel;
  text-align: center;

  pointer-events: auto;

  ${({ color, disabled }) =>
    disabled
      ? `background-color: '#bbb';`
      : `
    background-color: ${color ? color : '#fff'};
    &:hover {
      cursor: pointer;
      background-color: ${color ? color : '#bbb'};
      opacity: ${color ? 0.6 : 0.9};
    }
    &:active {
      background-color: ${color ? color : '#999'};
      opacity: ${color ? 0.3 : 0.6};
    }
  `}

  ${({ pulse }) =>
    pulse &&
    `
    animation: ${Pulse} 3s ease-in-out infinite;
  `}
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
