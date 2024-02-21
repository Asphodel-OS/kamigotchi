import { Room, emptyRoom } from 'layers/network/shapes/Room';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props {
  roomIndex: number;
  rooms: Map<number, Room>;
  actions: {
    move: (targetRoom: number) => void;
  };
}
export const Grid = (props: Props) => {
  const { roomIndex, rooms, actions } = props;
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
    for (let i = 0; i <= maxY; i++) {
      grid[i] = new Array<Room>(maxX + 1);
      grid[i].fill(emptyRoom);
    }

    // push the rooms into their respective locations
    for (const [_, room] of rooms) {
      grid[room.location.y][room.location.x] = room;
    }

    setGrid(grid);
  }, [rooms.size]);

  useEffect(() => {}, [grid]);

  return (
    <Wrapper>
      {grid.map((row, i) => (
        <Row key={i}>
          {row.map((room, j) => {
            let color = 'blue';
            let onClick: MouseEventHandler | undefined;
            if (room?.index === roomIndex) {
              color = 'red';
            } else if (rooms.get(roomIndex)?.exits?.find((e) => e.index === room.index)) {
              color = 'black';
              onClick = () => actions.move(room?.index ?? 0);
            }

            return (
              <Tile key={j} style={{ backgroundColor: color }} onClick={onClick}>
                {room?.index ?? 0}
              </Tile>
            );
          })}
        </Row>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background-color: #000;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
`;

const Row = styled.div`
  width: 100%;
  background-color: blue;
  display: flex;
  flex-flow: row nowrap;
  align-items: space-between;
  justify-content: center;
`;

const Tile = styled.div`
  background-color: red;
  border: 1px solid black;
  flex-grow: 1;

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      opacity: 0.6;
      cursor: pointer;
    }
  `}
`;
