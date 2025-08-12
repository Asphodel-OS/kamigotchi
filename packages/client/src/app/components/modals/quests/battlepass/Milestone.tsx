import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

// ActionButton is a text button that triggers an Action when clicked
export const Milestone = ({
  size,
  position,
  colors,
  onClick,
  tooltip,
  pulse,
  is,
}: {
  position: number; // as 0-100% from the left of the bar it's placed on
  onClick: Function | undefined;
  tooltip: string[];
  colors: {
    bg: string;
    ring: string;
  };
  is: {
    accepted: boolean;
    complete: boolean;
    disabled: boolean;
  };
  size?: number; // vw of diameter
  pulse?: boolean;
}) => {

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    if (onClick) onClick();
  };

  const Node = () => {
    if (!is.disabled)
      return (
        <ActiveButton
          size={size ?? 1.5}
          position={position}
          scale={0.25}
          shift={-0.5}
          onClick={handleClick}
          color={colors.bg}
          pulse={pulse}
        >
          <InnerRing scale={0.85} color={colors.ring} isVisible={is.accepted} />
          <InnerRing scale={0.5} color={colors.ring} isVisible={is.complete} />
        </ActiveButton>
      );
    return (
      <BaseButton
        size={size ?? 1.5}
        position={position}
        scale={0.25}
        shift={-0.5}
        color={colors.bg}
        pulse={pulse}
      >
        <InnerRing scale={0.85} color={colors.ring} isVisible={is.accepted} />
        <InnerRing scale={0.5} color={colors.ring} isVisible={is.complete} />
      </BaseButton>
    );
  };

  return (
    <Container>
      <TextTooltip text={tooltip}>
        <Node />
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  position: absolute;
  width: 100%;
  pointer-events: none;
`;

const BaseButton = styled.div<{
  size: number; // vw of diameter
  position: number; // 0-100%
  scale: number;
  shift: number;
  color: string;
  pulse?: boolean;
}>`
  position: relative;
  left: ${({ position }) => position}%;
  transform: translateX(${({ shift }) => 100 * shift}%);
  background-color: ${({ color }) => color};

  border: solid black 0.15vw;
  border-radius: ${({ size }) => size * 0.5}vw;
  height: ${({ size }) => size}vw;
  width: ${({ size }) => size}vw;

  display: flex;
  align-items: center;
  justify-content: center;

  pointer-events: auto;
`;

const ActiveButton = styled(BaseButton)`
  cursor: pointer;
  animation: ${({ pulse }) => pulse && pulseFx} 3s ease-in-out infinite;

  &:hover {
    animation: ${({ scale, shift }) => hoverFx(scale, shift)} 0.2s;
    transform: ${({ scale, shift }) =>
      `scale(${1 + scale}) translateX(${100 * shift * (1 - scale)}%)`};
  }
  &:active {
    animation: ${({ scale, shift }) => clickFx(scale, shift)} 0.2s;
  }
`;

const InnerRing = styled.div<{ scale: number; color: string; isVisible?: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
  position: absolute;
  border: solid ${({ color }) => color} 0.15vw;
  border-radius: 0.6vw;
  height: ${({ scale }) => scale * 100}%;
  width: ${({ scale }) => scale * 100}%;
`;
