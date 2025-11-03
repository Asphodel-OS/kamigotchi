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
  display: flex;
  flex-flow: row wrap;
  margin-bottom: 0.2em;
  justify-content: flex-start;
  align-items: center;
  user-select: none;
`;

const Image = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 3}rem;
  position: relative;
  image-rendering: pixelated;
  user-drag: none;
  margin-bottom: 0.6em;
  font-size: 0.7em;
`;

const Quantity = styled.div<{ scale: number }>`
  position: absolute;
  color: black;
  bottom: ${({ scale }) => scale * -0.6}rem;
  left: ${({ scale }) => scale * 4}rem;

  font-size: ${({ scale }) => scale * 0.6}rem;
  padding: ${({ scale }) => scale * 0.2}rem;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale * 1.2}rem;
  padding: ${({ scale }) => scale * 0.3}rem;
  ::placeholder {
    opacity: 1;
    color: black;
  }
`;
