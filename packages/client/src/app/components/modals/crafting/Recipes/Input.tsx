import styled from 'styled-components';

export const Input = ({
  image,
  amt,
  prepend,
  scale = 1,
}: {
  image: string;
  amt: number;
  prepend?: string;
  scale?: number;
}) => {
  return (
    <Container>
      <Text scale={scale}>{prepend}</Text>
      <Image src={image} scale={scale} />
      <Quantity scale={scale}>{amt}</Quantity>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin-bottom: 0.3vw;

  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;

  user-select: none;
`;

const Image = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 3}vw;
  position: relative;
  image-rendering: pixelated;
  user-drag: none;
  font-size: 0.7vw;
`;

const Quantity = styled.div<{ scale: number }>`
  position: absolute;
  color: black;
  bottom: ${({ scale }) => scale * -0.6}vw;
  left: ${({ scale }) => scale * 4}vw;

  font-size: ${({ scale }) => scale * 0.6}vw;
  padding: ${({ scale }) => scale * 0.2}vw;

  font-weight: 900;
  border-radius: 0.3vw;
  background-color: rgba(255, 255, 255, 1);
  border: solid black 0.08vw;
`;

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale * 1.2}vw;
  padding: ${({ scale }) => scale * 0.3}vw;
  ::placeholder {
    opacity: 1;
    color: black;
  }
`;
