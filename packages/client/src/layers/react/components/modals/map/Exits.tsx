import styled from 'styled-components';

import { Room } from 'layers/network/shapes/Room';
import { playClick } from 'utils/sounds';

interface Props {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
  actions: {
    move: (targetRoom: number) => void;
  };
}

export const Exits = (props: Props) => {
  const { index, rooms, actions } = props;
  if (index == 0 || !rooms.has(index)) return <div />;

  const handleClick = (targetRoom: number) => {
    playClick();
    actions.move(targetRoom);
  };

  ///////////////////
  // RENDER

  return (
    <Container>
      <Title>Exits</Title>
      {rooms.get(index)!.exits!.map((exitIndex) => {
        const exit = rooms.get(exitIndex)!;
        return (
          <ClickableDescription key={exit.index} onClick={() => handleClick(exit.index)}>
            → {exit.name}
          </ClickableDescription>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;

  height: 100%;
  margin: 1vw;
`;

const Title = styled.div`
  color: #333;
  padding-bottom: 0.5vw;

  font-family: Pixel;
  font-size: 0.7vw;
  text-align: left;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: 0.3vw 0.6vw;
  border-radius: 0.3vw;

  font-size: 0.6vw;
  font-family: Pixel;
  text-align: left;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
