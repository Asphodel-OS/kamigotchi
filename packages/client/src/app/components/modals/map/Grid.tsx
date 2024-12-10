import { EntityIndex } from '@mud-classic/recs';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { mapBackgrounds } from 'assets/images/map';
import { BaseKami } from 'network/shapes/Kami/types';
import { emptyRoom, Room } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';
import { FloatingMapKami } from './FloatingMapKami';

const KamiNames: Map<number, string[]> = new Map<number, string[]>();

interface Props {
  index: number; // index of current room
  zone: number;
  rooms: Map<number, Room>;
  accountKamis: EntityIndex[];
  actions: {
    move: (roomIndex: number) => void;
  };
  utils: {
    queryNodeKamis: (nodeIndex: number) => EntityIndex[];
    queryAccountsByRoom: (roomIndex: number) => EntityIndex[];
    setHoveredRoom: (roomIndex: number) => void;
    getKamiLocation: (kamiIndex: EntityIndex) => number | undefined;
    getBaseKami: (kamiIndex: EntityIndex) => BaseKami;
  };
}

export const Grid = (props: Props) => {
  const { index, zone, rooms, actions, utils, accountKamis } = props;
  const { queryNodeKamis, queryAccountsByRoom, setHoveredRoom, getKamiLocation, getBaseKami } =
    utils;
  const [grid, setGrid] = useState<Room[][]>([]);
  const [kamis, setKamis] = useState<EntityIndex[]>([]);
  const [players, setPlayers] = useState<EntityIndex[]>([]);
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

  // manages Kami harvest location and name
  useEffect(() => {
    KamiNames.forEach((value, key) => {
      KamiNames.delete(key);
    });
    accountKamis.forEach((accountKami) => {
      const kamiLocation = getKamiLocation(accountKami);
      if (kamiLocation !== undefined) {
        const kamiNames = KamiNames.get(kamiLocation) ?? [];
        kamiNames.push(getBaseKami(accountKami).name);
        KamiNames.set(kamiLocation, kamiNames);
      }
    });
  }, [accountKamis]);

  const getKamiString = (roomIndex: number) => {
    const names = KamiNames.get(roomIndex);
    let res = '';
    if (names !== undefined) {
      names.length > 1
        ? (res = `${names.slice(0, -1).join(',') + ' and ' + names.slice(-1)} are Harvesting on this tile`)
        : (res = `${names} is Harvesting on this tile`);
    }
    return res;
  };

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
              const hasKamis = room?.index !== undefined && !!KamiNames.has(room.index);

              let backgroundColor;
              let onClick: MouseEventHandler | undefined;
              if (isCurrRoom) backgroundColor = 'rgba(51,187,51,0.9)';
              else if (isBlocked) backgroundColor = 'rgba(0,0,0,0.3)';
              else if (isExit) {
                backgroundColor = 'rgba(255,136,85,0.6)';
                onClick = () => handleRoomMove(room?.index ?? 0);
              }

              let tile = (
                <Tile
                  key={j}
                  backgroundColor={backgroundColor}
                  onClick={onClick}
                  hasRoom={isRoom}
                  isHighlighted={isCurrRoom || isExit}
                  onMouseEnter={() => updateRoomStats(room.index)}
                  onMouseLeave={() => {
                    if (isRoom) setHoveredRoom(0);
                  }}
                >
                  {hasKamis && <FloatingMapKami />}
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
                  getKamiString(room.index),
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

const Tile = styled.div<{
  hasRoom: boolean;
  isHighlighted: boolean;
  backgroundColor: any;
}>`
  border-right: 0.01vw solid rgba(0, 0, 0, 0.2);
  border-top: 0.01vw solid rgba(0, 0, 0, 0.2);
  background-color: ${({ backgroundColor }) => backgroundColor};
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
    border: 0.01vw solid rgba(0, 0, 0, 1);
    }
  `}

  ${({ isHighlighted }) =>
    isHighlighted &&
    `
    opacity: 0.9;
    border: 0.01vw solid black;
 
  `}

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      cursor: pointer;
    }
  `}
`;
