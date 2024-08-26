import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  onClick: Function;
  text?: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  noMargin?: boolean;
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = (props: Props) => {
  const { img, onClick, text, size, disabled, color, pulse, noMargin } = props;
  const scale = size ?? 2.5;

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  // override styles for sizes and disabling
  const setStyles = () => {
    let styles: any = {};
    if (color) styles.backgroundColor = color;
    if (disabled) styles.backgroundColor = '#b2b2b2';

    return styles;
  };

  return (
    <Button
      scale={scale}
      onClick={!disabled ? handleClick : () => {}}
      style={setStyles()}
      color={color ?? '#fff'}
      pulse={pulse}
      noMargin={noMargin}
      disabled={disabled}
      square={!text}
    >
      <Image src={img} scale={scale} />
      {text && <Text scale={scale}>{text}</Text>}
    </Button>
  );
};

interface ButtonProps {
  scale: number;
  color: string;
  disabled?: boolean;
  pulse?: boolean;
  noMargin?: boolean;
  square?: boolean;
}

const Button = styled.button<ButtonProps>`
  border: solid black 0.15vw;
  border-radius: ${({ scale }) => scale * 0.2}vw;
  height: ${({ scale }) => scale}vw;
  ${({ square, scale }) => square && `width: ${scale}vw;`}

  margin: ${({ scale, noMargin }) => (noMargin ? 0 : scale * 0.1)}vw;
  padding: ${({ scale }) => scale * 0.1}vw;
  gap: ${({ scale }) => scale * 0.1}vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;

  background-color: ${({ color, disabled }) => (disabled ? '#bbb' : color)};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  user-select: none;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }

  animation: ${({ pulse }) => pulse && pulseFx} 3s ease-in-out infinite;
`;

const Image = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 0.75}vw;
`;

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale * 0.25}vw;
`;
