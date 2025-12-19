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
      <div>
        <Image src={image} scale={scale} />
        <Quantity scale={scale}>{amt}</Quantity>
      </div>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  margin-top: 0.45em;
  gap: 0.4em;

  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: center;

  user-select: none;

  > div {
    display: grid;
    justify-items: start;
  }
`;

const Image = styled.img<{ scale: number }>`
  height: 3em;

  image-rendering: pixelated;
  user-drag: none;
`;

const Quantity = styled.div<{ scale: number }>`
  color: black;
  margin-left: 80%;
  position: absolute;
  bottom: ${({ scale }) => scale * -0.3}em;
  right: ${({ scale }) => scale * -0.6}em;

  font-size: ${({ scale }) => scale * 0.7}em;
  padding: ${({ scale }) => scale * 0.2}em;

  font-weight: 900;
  border-radius: 0.3em;
  background-color: rgba(255, 255, 255, 1);
  border: solid black 0.08em;
`;

const Text = styled.span<{ scale: number }>`
  font-size: 1.2em;
  ::placeholder {
    opacity: 1;
    color: black;
  }
`;
