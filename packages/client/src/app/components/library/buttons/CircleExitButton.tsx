import styled from 'styled-components';
import { playClick } from 'utils/sounds';

export const CircleExitButton = ({
  scale = 1.2,
  onClick,
  circle = false,
}: {
  scale?: number;
  onClick?: () => void;
  circle?: boolean;
}) => {
  const handleClick = () => {
    playClick();
    onClick?.();
  };

  return (
    <Container scale={scale} onClick={handleClick} circle={circle}>
      X
    </Container>
  );
};

// circular exit button on the top right of the Container
const Container = styled.div<{ scale: number; circle?: boolean }>`
  border: 0.15vw solid black;
  border-radius: ${({ scale, circle }) => (circle ? scale * 0.5 : 0.6)}vw;
  background-color: #fff;

  width: ${({ scale }) => scale}vw;
  height: ${({ scale }) => scale}vw;

  font-size: ${({ scale }) => scale * 0.75}vw;
  text-align: center;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  user-select: none;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
