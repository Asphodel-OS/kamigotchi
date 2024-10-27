import { ForwardedRef, forwardRef } from 'react';
import styled from 'styled-components';

import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  onClick: Function;
  text?: string;
  color?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  pulse?: boolean;
  balance?: number;
  corner?: boolean;
  radius?: number;
  scale?: number;
  scaleOrientation?: 'vw' | 'vh';
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = forwardRef(function IconButton(
  props: Props,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { img, onClick, text, disabled, fullWidth, color, pulse } = props;
  const { balance, corner } = props; // IconListButton options
  const scale = props.scale ?? 2.5;
  const scaleOrientation = props.scaleOrientation ?? 'vw';
  const radius = props.radius ?? 0.45;

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  return (
    <Button
      color={color ?? '#fff'}
      onClick={!disabled ? handleClick : () => {}}
      scale={scale}
      orientation={scaleOrientation}
      radius={radius}
      fullWidth={fullWidth}
      disabled={disabled}
      pulse={pulse}
      ref={ref}
    >
      <Image src={img} scale={scale} orientation={scaleOrientation} />
      {text && (
        <Text scale={scale} orientation={scaleOrientation}>
          {text}
        </Text>
      )}
      {balance && <Balance>{balance}</Balance>}
      {corner && <Corner radius={radius - 0.15} />}
    </Button>
  );
});

interface ButtonProps {
  color: string;
  scale: number;
  orientation: string;
  radius: number;
  fullWidth?: boolean;
  disabled?: boolean;
  pulse?: boolean;
}

const Button = styled.button<ButtonProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: ${({ radius }) => radius}vw;
  height: ${({ scale }) => scale}${({ orientation }) => orientation};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  padding: ${({ scale }) => scale * 0.1}${({ orientation }) => orientation};
  gap: ${({ scale }) => scale * 0.1}${({ orientation }) => orientation};

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

const Image = styled.img<{ scale: number; orientation: string }>`
  width: ${({ scale }) => scale * 0.75}${({ orientation }) => orientation};
  height: ${({ scale }) => scale * 0.75}${({ orientation }) => orientation};
  ${({ scale }) => (scale > 4.5 ? 'image-rendering: pixelated;' : '')}
`;

const Text = styled.div<{ scale: number; orientation: string }>`
  font-size: ${({ scale }) => scale * 0.3}${({ orientation }) => orientation};
`;

const Corner = styled.div<{ radius: number }>`
  position: absolute;
  border: solid black 0.3vw;
  border-radius: 0 0 ${({ radius }) => radius}vw 0;
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
