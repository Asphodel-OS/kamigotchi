import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { World } from '@mud-classic/recs';
import { Tooltip } from 'app/components/library';
import { mapBackgrounds } from 'assets/images/map';
import { Components } from 'network/';
import { getNodeByIndex } from 'network/shapes/Node';
import { Room, emptyRoom } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';

interface Props {
  world: World;
  components: Components;
  index: number; // index of current room
  zone: number;
  rooms: Map<number, Room>;
  actions: {
    move: (roomIndex: number) => void;
    setHoveredRoom: (roomIndex: number) => void;
  };
}
export const Grid = (props: Props) => {
  const { world, components, index, zone, rooms, actions } = props;
  const [grid, setGrid] = useState<Room[][]>([]);
  const [numberOfKamisAndPlayers, setnumberOfKamisAndPlayers] = useState(['0', '0']);

  useEffect(() => {
    const z = rooms.get(index)?.location.z;
    if (!z) return;
    if (z === 2) {
      setGrid([]);
      return;
    }

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
    const width = maxX - minX + 2;
    const height = maxY - minY + 3;
    const grid = new Array<Room[]>();
    for (let i = 0; i < height; i++) {
      grid[i] = new Array<Room>(width);
      grid[i].fill(emptyRoom);
    }

    // push the rooms into their respective locations
    const xOffset = minX - 1;
    const yOffset = minY;
    for (const [_, room] of rooms) {
      if (room.location.z !== z) continue;
      grid[room.location.y - yOffset][room.location.x - xOffset] = room;
    }

    setGrid(grid);
  }, [zone]);

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
      <Background src={mapBackgrounds[zone]} />
      <Overlay>
        {grid.map((row, i) => (
          <Row key={i}>
            {row.map((room, j) => {
              const isRoom = room.index != 0;
              const isCurrRoom = room.index == index;

              const currExit = rooms.get(index)?.exits?.find((e) => e.toIndex === room.index);
              const isExit = !!currExit;
              const isBlocked = currExit?.blocked; // blocked exit

              let color, opacity;
              let onClick: MouseEventHandler | undefined;
              if (isCurrRoom) {
                color = '#3b3';
                opacity = 0.9;
              } else if (isBlocked) {
                color = '#000';
                opacity = 0.3;
              } else if (isExit) {
                color = '#f85';
                opacity = 0.6;
                onClick = () => handleRoomMove(room?.index ?? 0);
              }

              let tile = (
                <Tile
                  key={j}
                  style={{ backgroundColor: color, opacity }}
                  onClick={onClick}
                  hasRoom={isRoom}
                  isHighlighted={isCurrRoom || isExit}
                  onMouseEnter={() => {
                    if (isRoom) actions.setHoveredRoom(room.index);
                    const node = getNodeByIndex(world, components, room.index, { kamis: true });
                    setnumberOfKamisAndPlayers([
                      node.kamis.length.toString(),
                      room.players?.length.toString() ?? '0',
                    ]);
                  }}
                  onMouseLeave={() => {
                    if (isRoom) actions.setHoveredRoom(0);
                  }}
                />
              );

              if (isRoom) {
                const name = `${room.name} ${isBlocked ? '(blocked)' : ''}`;
                const description = [
                  name,
                  '',
                  room.description,
                  '',
                  'Number of harvesting Kamis on tile',
                  `Kamis: ${numberOfKamisAndPlayers[0]}`,
                  'Number of Players on tile',
                  `Players: ${numberOfKamisAndPlayers[1]}`,
                ];

                tile = (
                  <Tooltip key={j} text={description} grow>
                    {tile}
                  </Tooltip>
                );
              }
              return tile;
            })}
          </Row>
        ))}
      </Overlay>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const Background = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 0px 0px 1.05vw 1.05vw;
  image-rendering: pixelated;
`;

const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;

  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-content: stretch;
  align-items: stretch;
  flex-grow: 1;
`;

const Tile = styled.div<{ hasRoom: boolean; isHighlighted: boolean }>`
  opacity: 0.2;
  border-right: 0.01vw solid black;
  border-top: 0.01vw solid black;

  display: flex;
  align-content: stretch;
  align-items: stretch;
  justify-content: stretch;
  flex-grow: 1;

  ${({ hasRoom }) =>
    hasRoom &&
    `
    &:hover {
      opacity: 0.9;
      cursor: help;
      border-left: 0.01vw solid black;
      border-bottom: 0.01vw solid black;
    }
  `}

  ${({ isHighlighted }) =>
    isHighlighted &&
    `
    opacity: 0.9;
    border-left: 0.01vw solid black;
    border-bottom: 0.01vw solid black;
  `}

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      cursor: pointer;
    }
  `}
`;
