import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { mapBackgrounds } from 'assets/images/map';
import { Room, emptyRoom } from 'layers/network/shapes/Room';
import { playClick } from 'utils/sounds';

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
    const z = rooms.get(index)?.location.z;

    // establish the grid size
    let maxX = 0;
    let maxY = 0;
    let minX = 9999;
    let minY = 9999;
    for (const [_, room] of rooms) {
      if (room.location.z !== z) continue;
      if (room.location.x > maxX) maxX = room.location.x;
      if (room.location.y > maxY) maxY = room.location.y;
      if (room.location.x < minX) minX = room.location.x;
      if (room.location.y < minY) minY = room.location.y;
    }

    // create each row
    const width = maxX - minX + 3;
    const height = maxY - minY + 3;
    const grid = new Array<Room[]>();
    for (let i = 0; i < height; i++) {
      grid[i] = new Array<Room>(width);
      grid[i].fill(emptyRoom);
    }

    // push the rooms into their respective locations
    const xOffset = minX - 1;
    const yOffset = minY - 1;
    for (const [_, room] of rooms) {
      if (room.location.z !== z) continue;
      grid[room.location.y - yOffset][room.location.x - xOffset] = room;
    }

    setGrid(grid);
  }, [rooms.size]);

  /////////////////
  // INTERACTIONS

  const handleRoomMove = (roomIndex: number) => {
    playClick();
    actions.move(roomIndex);
  };

  /////////////////
  // RENDER

  return (
    <Container>
      <Background src={mapBackgrounds.zone1} />
      {grid.map((row, i) => (
        <Row key={i}>
          {row.map((room, j) => {
            const isRoom = room.index != 0;
            const isCurrRoom = room.index == index;
            const isExit = rooms.get(index)?.exits?.find((e) => e === room.index);

            let color, opacity;
            let onClick: MouseEventHandler | undefined;
            if (isCurrRoom) {
              color = '#3b3';
              opacity = 0.9;
            } else if (isExit) {
              color = '#f85';
              opacity = 0.6;
              onClick = () => handleRoomMove(room?.index ?? 0);
            } else if (isRoom) {
              color = '#d33';
            }

            return (
              <Tile
                key={j}
                style={{ backgroundColor: color, opacity }}
                onClick={onClick}
                hasRoom={isRoom}
                onMouseEnter={() => {
                  if (isRoom) actions.setHoveredRoom(room.index);
                }}
                onMouseLeave={() => {
                  if (isRoom) actions.setHoveredRoom(0);
                }}
              />
            );
          })}
        </Row>
      ))}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  overflow-y: scroll;
`;

const Background = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: space-between;
  justify-content: center;
`;

const Tile = styled.div<{ hasRoom: boolean }>`
  opacity: 0.1;
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
      opacity: 0.9;
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
