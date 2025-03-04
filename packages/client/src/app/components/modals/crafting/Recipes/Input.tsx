import styled from 'styled-components';

interface Props {
  image: string;
  amt: number;
  prepend?: string;
  scale?: number;
}

export const Input = (props: Props) => {
  const { image, amt, prepend } = props;
  const scale = props.scale ?? 1;

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
  flex-flow: row nowrap;

  justify-content: flex-start;
  align-items: center;
  user-select: none;
`;

const Image = styled.img<{ scale: number }>`
  height: ${({ scale }) => scale * 3}vw;
  position: relative;
  image-rendering: pixelated;
`;

const Quantity = styled.div<{ scale: number }>`
  position: absolute;
  color: black;
  bottom: ${({ scale }) => scale * -0.6}vw;
  left: ${({ scale }) => scale * 4}vw;

  font-size: ${({ scale }) => scale * 0.6}vw;
  padding: ${({ scale }) => scale * 0.2}vw;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div<{ scale: number }>`
  font-size: ${({ scale }) => scale * 1.2}vw;
  padding: ${({ scale }) => scale * 0.3}vw;
  ::placeholder {
    opacity: 1;
    color: black;
  }
`;
