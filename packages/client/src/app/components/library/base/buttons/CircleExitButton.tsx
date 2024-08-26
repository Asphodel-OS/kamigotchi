import styled from 'styled-components';

interface Props {
  scale?: number;
  onClick?: () => void;
  circle?: boolean;
}

export const CircleExitButton = (props: Props) => {
  const { scale, onClick, circle } = props;

  return (
    <Container scale={scale ?? 1.2} onClick={onClick} circle={circle}>
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
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
