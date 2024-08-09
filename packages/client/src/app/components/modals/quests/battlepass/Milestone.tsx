import { Tooltip } from 'app/components/library';
import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  size: number; // vw of diameter
  position: number; // as 0-100% from the left of the bar it's placed on
  onClick: Function;
  tooltip: string[];
  colors: {
    bg: string;
    ring: string;
  };
  is: {
    accepted: boolean;
    complete: boolean;
  };
  disabled?: boolean;
  pulse?: boolean;
}

// ActionButton is a text button that triggers an Action when clicked
export const Milestone = (props: Props) => {
  const { size, position, onClick, tooltip, disabled, colors, pulse, is } = props;

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  return (
    <Container>
      <Tooltip text={tooltip}>
        <Button
          size={size}
          position={position}
          scale={0.25}
          shift={-0.5}
          onClick={!disabled ? handleClick : () => {}}
          color={colors.bg}
          disabled={disabled}
          pulse={pulse}
        >
          <InnerRing scale={0.85} color={colors.ring} isVisible={is.accepted} />
          <InnerRing scale={0.5} color={colors.ring} isVisible={is.complete} />
        </Button>
      </Tooltip>
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

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: ${({ color }) => color};
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

const InnerRing = styled.div<{ scale: number; color: string; isVisible?: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
  position: absolute;
  border: solid ${({ color }) => color} 0.15vw;
  border-radius: 0.6vw;
  height: ${({ scale }) => scale * 100}%;
  width: ${({ scale }) => scale * 100}%;
`;
