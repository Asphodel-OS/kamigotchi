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
  font-size: ${({ scale }) => scale}em;

  display: flex;
  gap: 0.4em;
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
  font-size: 0.6em;
  margin-left: 80%;
`;

const Text = styled.span<{ scale: number }>`
  font-size: 1.2em;
  ::placeholder {
    opacity: 1;
    color: black;
  }
`;
