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
      <Options>
        {rooms.get(index)!.exits!.map((exitIndex) => {
          const exit = rooms.get(exitIndex)!;
          if (!exit) return;
          return (
            <ClickableDescription key={exit.index} onClick={() => handleClick(exit.index)}>
              → {exit.name}
            </ClickableDescription>
          );
        })}
      </Options>
    </Container>
  );
};

const Container = styled.div`
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  border-right: solid black 0.15vw;

  height: 9vh;
  width: 100%;
`;

const Title = styled.div`
  position: absolute;
  border-bottom: solid #eee 0.1vw;
  padding: 0.45vw;
  width: 100%;
  background-color: #eee;

  color: #333;
  font-family: Pixel;
  font-size: 0.6vw;
  text-align: left;
`;

const Options = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding-top: 1.8vw;

  width: 100%;
  height: 100%;
  overflow-y: scroll;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: 0.3vw 0.6vw;
  border-radius: 0.45vw;
  width: 100%;

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
