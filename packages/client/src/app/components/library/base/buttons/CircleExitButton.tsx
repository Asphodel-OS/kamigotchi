import styled from 'styled-components';

interface Props {
  scale?: number;
  onClick?: () => void;
}

export const CircleExitButton = (props: Props) => {
  const { scale, onClick } = props;

  return (
    <Container scale={scale ?? 1.2} onClick={onClick}>
      X
    </Container>
  );
};

// circular exit button on the top right of the Container
const Container = styled.div<{ scale: number }>`
  border: 0.15vw solid black;
  border-radius: ${({ scale }) => scale * 0.5}vw;
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
