import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';

interface Props {
  kami: Kami;
  onClick?: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
}

export const KamiBlock = (props: Props) => {
  const { kami, onClick } = props;
  const { index, progress, name } = kami;

  return (
    <Container>
      <Image src={kami.image} onClick={onClick} />
      <Overlay top={0.9} left={0.7}>
        <Grouping>
          <Text size={0.6}>Lvl</Text>
          <Text size={0.6}>{progress?.level ?? '???'}</Text>
        </Grouping>
      </Overlay>
      <Overlay top={0.9} right={0.7}>
        <Text size={0.6}>{index}</Text>
      </Overlay>
      <Overlay bottom={0.6} fullWidth>
        <Text size={0.6}>{name}</Text>
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  background-color: white;
  border-radius: 0.6vw;
  margin: 0.9vw;
  filter: drop-shadow(0.2vw 0.2vw 0.1vw black);
`;

const Image = styled.img<{ onClick?: () => void }>`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  width: 10vw;
  image-rendering: pixelated;

  cursor: ${({ onClick }) => (onClick ? 'pointer' : 'inherit')};
  pointer-events: ${({ onClick }) => (onClick ? 'auto' : 'none')};
  &:hover {
    opacity: 0.6;
  }
`;

const Grouping = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-flow: row nowrap;
  align-items: flex-end;
`;

const Text = styled.div<{ size: number }>`
  color: white;
  font-size: ${(props) => props.size}vw;
  text-shadow: ${(props) => `0 0 ${props.size * 0.5}vw black`};
`;

const ClickBox = styled.button<{ isSelected: boolean }>`
  position: absolute;
  bottom: 0.5vw;
  right: 0.5vw;
  width: 2vw;
  height: 2vw;

  border: ${({ isSelected }) => (isSelected ? 'solid .15vw #FFF' : 'solid .15vw #333')};
  border-radius: 0.4vw;
  opacity: 0.9;
  backgroundColor: '#3498DB',
  &:hover {
    background-color: #aaa;
  }
`;
