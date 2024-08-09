import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  size: number; // vw of diameter
  position: number; // as 0-100% from the left of the bar it's placed on
  onClick: Function;
  color: string;
  disabled?: boolean;
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const Milestone = (props: Props) => {
  const { size, position, onClick, disabled, color, pulse } = props;

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  return (
    <Container>
      <Button
        size={size}
        position={position}
        scale={0.1}
        shift={-0.5}
        onClick={!disabled ? handleClick : () => {}}
        color={color}
        disabled={disabled}
        pulse={pulse}
      />
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  width: 100%;
  pointer-events: none;
`;

interface ButtonProps {
  size: number; // vw of diameter
  position: number; // 0-100%
  scale: number;
  shift: number;
  color: string;
  disabled?: boolean;
  pulse?: boolean;
}

const Button = styled.div<ButtonProps>`
  position: relative;
  left: ${({ position }) => position}%;
  transform: translateX(-50%);

  border: solid black 0.15vw;
  border-radius: ${({ size }) => size * 0.5}vw;
  height: ${({ size }) => size}vw;
  width: ${({ size }) => size}vw;

  background-color: ${({ color, disabled }) => (disabled ? '#bbb' : color)};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    animation: ${({ scale, shift }) => hoverFx(scale, shift)} 0.2s;
    transform: ${({ scale, shift }) =>
      `scale(${1 + scale}) translateX(${100 * shift * (1 - scale)}%)`};
  }
  &:active {
    animation: ${({ scale, shift }) => clickFx(scale, shift)} 0.2s;
  }

  animation: ${({ pulse }) => pulse && pulseFx} 3s ease-in-out infinite;
`;
