import styled from 'styled-components';

import { Room } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';

export const Exits = ({
  index,
  rooms,
  actions,
}: {
  index: number; // index of displayed room
  rooms: Map<number, Room>;
  actions: {
    move: (targetRoom: number) => void;
  };
}) => {
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
        {rooms.get(index)?.exits?.map((exit) => {
          const room = rooms.get(exit.toIndex)!;
          if (!room) return;
          else if (exit.blocked)
            return (
              <UnclickableDescription key={room.index}>
                → {room.name} (blocked)
              </UnclickableDescription>
            );
          else
            return (
              <ClickableDescription key={room.index} onClick={() => handleClick(room.index)}>
                → {room.name}
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
  border-right: solid black 0.15rem;

  height: 100%;
  width: 100%;
`;

const Title = styled.div`
  position: absolute;
  padding: 0.6rem;
  width: 100%;
  background-color: #eee;

  color: #333;
  font-family: Pixel;
  font-size: 0.9rem;
  text-align: left;
`;

const Options = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  padding-top: 2.7rem;

  width: 100%;
  height: 100%;
  overflow-y: scroll;
`;

// TODO: merge this with Description using props
const ClickableDescription = styled.div`
  color: #333;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 0.45rem;
  width: 100%;

  font-family: Pixel;
  font-size: 0.75rem;
  line-height: 1.2rem;
  text-align: left;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

// TODO: merge this with Description using props
const UnclickableDescription = styled.div`
  color: #555;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 0.45rem;
  width: 100%;

  font-family: Pixel;
  font-size: 0.75rem;
  line-height: 1.2rem;
  text-align: left;

  background-color: #eee;
`;
