import { Room, emptyRoom } from 'layers/network/shapes/Room';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props {
  index: number; // index of current room
  rooms: Map<number, Room>;
  actions: {
    move: (roomIndex: number) => void;
    setHoveredRoom: (roomIndex: number) => void;
  };
}
export const Grid = (props: Props) => {
  const { index, rooms, actions } = props;
  const [grid, setGrid] = useState<Room[][]>([]);

  useEffect(() => {
    // establish the grid size
    let maxX = 0;
    let maxY = 0;
    for (const [_, room] of rooms) {
      if (room.location.x > maxX) maxX = room.location.x;
      if (room.location.y > maxY) maxY = room.location.y;
    }

    // create eeach row
    const grid = new Array<Room[]>();
    for (let i = 1; i <= maxY + 2; i++) {
      grid[i] = new Array<Room>(maxX + 3);
      grid[i].fill(emptyRoom);
    }

    // push the rooms into their respective locations
    for (const [_, room] of rooms) {
      grid[room.location.y + 1][room.location.x + 1] = room;
    }

    setGrid(grid);
  }, [rooms.size]);

  useEffect(() => {}, [grid]);

  return (
    <Container>
      {grid.map((row, i) => (
        <Row key={i}>
          {row.map((room, j) => {
            const isRoom = room.index != 0;
            const isCurrRoom = room.index == index;
            const isExit = rooms.get(index)?.exits?.find((e) => e === room.index);

            let color = 'gray';
            let onClick: MouseEventHandler | undefined;
            if (isCurrRoom) {
              color = 'red';
            } else if (isExit) {
              color = 'orange';
              onClick = () => actions.move(room?.index ?? 0);
            } else if (isRoom) {
              color = 'green';
            }

            return (
              <Tile
                key={j}
                style={{ backgroundColor: color }}
                onClick={onClick}
                hasRoom={isRoom}
                onMouseEnter={() => {
                  if (isRoom) actions.setHoveredRoom(room.index);
                }}
                onMouseLeave={() => {
                  if (isRoom) actions.setHoveredRoom(0);
                }}
              >
                {room?.index != 0 ? room?.index : ''}
              </Tile>
            );
          })}
        </Row>
      ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  overflow-y: scroll;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: space-between;
  justify-content: center;
`;

const Tile = styled.div<{ hasRoom: boolean }>`
  background-color: red;
  border: 0.1vw solid black;
  width: 1.5vw;
  height: 1.5vw;

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Pixel;
  font-size: 0.8vw;
  text-align: center;

  ${({ hasRoom }) =>
    hasRoom &&
    `
    &:hover {
      opacity: 0.6;
      cursor: help;
    }
  `}

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      cursor: pointer;
    }
  `}
`;
