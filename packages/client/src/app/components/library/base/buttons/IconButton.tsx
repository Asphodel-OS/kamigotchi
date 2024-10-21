import { ForwardedRef, forwardRef } from 'react';
import styled from 'styled-components';

import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  onClick: Function;
  text?: string;
  scale?: number;
  color?: string;
  disabled?: boolean;
  noMargin?: boolean;
  pulse?: boolean;
  balance?: number;
  corner?: boolean;
  scaleOrientation?: 'vw' | 'vh';
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = forwardRef(function IconButton(
  props: Props,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { img, onClick, text, disabled, color, pulse, noMargin } = props;
  const { balance, corner } = props; // IconListButton options
  const scale = props.scale ?? 2.5;
  const scaleOrientation = props.scaleOrientation ?? 'vw';

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
      ref={ref}
    >
      <Image src={img} scale={scale} orientation={scaleOrientation} />
      {text && <Text scale={scale}>{text}</Text>}
      {balance && <Balance>{balance}</Balance>}
      {corner && <Corner />}
    </Button>
  );
});

interface ButtonProps {
  scale: number;
  color: string;
  disabled?: boolean;
  pulse?: boolean;
  noMargin?: boolean;
  square?: boolean;
}

const Button = styled.button<ButtonProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.45vw;
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

const Corner = styled.div`
  position: absolute;
  border: solid black 0.3vw;
  border-color: transparent black black transparent;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
`;

const Balance = styled.div`
  position: absolute;
  background-color: white;
  border-top: solid black 0.15vw;
  border-left: solid black 0.15vw;
  border-radius: 0.3vw 0 0.3vw 0;
  bottom: 0;
  right: 0;

  font-size: 0.75vw;
  align-items: center;
  justify-content: center;
  padding: 0.2vw;
`;

const Image = styled.img<{ scale: number; orientation: string }>`
  height: ${({ scale }) => scale * 0.75}${({ orientation }) => orientation};
  ${({ scale }) => (scale > 3.2 ? 'image-rendering: pixelated;' : '')}
`;

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale * 0.25}vw;
`;
