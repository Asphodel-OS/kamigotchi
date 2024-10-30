import { EntityIndex } from '@mud-classic/recs';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { kamiIcon } from 'assets/images/icons/menu';
import { mapBackgrounds } from 'assets/images/map';
import { Harvest } from 'network/shapes/Harvest';
import { Kami } from 'network/shapes/Kami';
import { emptyRoom, Room } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';

interface Props {
  index: number; // index of current room
  zone: number;
  rooms: Map<number, Room>;
  accountKamis: Kami[];
  actions: {
    move: (roomIndex: number) => void;
  };
  utils: {
    queryNodeKamis: (nodeIndex: number) => EntityIndex[];
    queryAccountsByRoom: (roomIndex: number) => EntityIndex[];
    setHoveredRoom: (roomIndex: number) => void;
    queryKamisByAccount: () => EntityIndex[];
    getHarvest: (entityIndex: EntityIndex) => Harvest;
    getHarvestEntity: (kamiIndex: number) => EntityIndex | undefined;
  };
}

export const Grid = (props: Props) => {
  const { index, zone, rooms, actions, utils, accountKamis } = props;
  const {
    queryNodeKamis,
    queryAccountsByRoom,
    setHoveredRoom,
    queryKamisByAccount,
    getHarvest,
    getHarvestEntity,
  } = utils;
  const [grid, setGrid] = useState<Room[][]>([]);
  const [kamis, setKamis] = useState<EntityIndex[]>([]);
  const [players, setPlayers] = useState<EntityIndex[]>([]);
  const [harvestMap, setHarvestMap] = useState<Map<number, boolean>>(new Map());

  // set the grid whenever the room zone changes
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
  //
  useEffect(() => {
    const newHarvestMap = new Map<number, boolean>();
    queryKamisByAccount().forEach((accountKami) => {
      const harvestEntity = getHarvestEntity(accountKami);
      if (harvestEntity) {
        const harvestInfo = getHarvest(harvestEntity);
        harvestInfo !== undefined &&
          newHarvestMap.set(harvestInfo.node?.index ?? 0, harvestInfo.state === 'ACTIVE');
      }
    });
    setHarvestMap(newHarvestMap);
  }, [accountKamis]);
  /////////////////
  // INTERACTIONS

  const handleRoomMove = (roomIndex: number) => {
    playClick();
    actions.move(roomIndex);
  };

  // updates the stats for a room and set it as the hovered room
  const updateRoomStats = (roomIndex: number) => {
    if (roomIndex != 0) {
      setHoveredRoom(roomIndex);
      setPlayers(queryAccountsByRoom(roomIndex));
      setKamis(queryNodeKamis(roomIndex));
    }
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
              // TODO: move this logic elsewher for a bit of sanity
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
                  onMouseEnter={() => updateRoomStats(room.index)}
                  onMouseLeave={() => {
                    if (isRoom) setHoveredRoom(0);
                  }}
                >
                  {room?.index !== undefined && harvestMap.get(room.index) && (
                    <img
                      src={kamiIcon}
                      style={{
                        opacity: 1!,
                      }}
                    />
                  )}
                </Tile>
              );

              if (isRoom) {
                const name = `${room.name} ${isBlocked ? '(blocked)' : ''}`;
                const description = [
                  name,
                  '',
                  room.description,
                  '',
                  `${players.length} players on this tile`,
                  `${kamis.length} kamis harvesting`,
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
