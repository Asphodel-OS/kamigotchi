import { EntityIndex } from '@mud-classic/recs';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { kamiIcon } from 'assets/images/icons/menu';
import { mapBackgrounds } from 'assets/images/map';
import { Kami } from 'network/shapes/Kami';
import { BaseKami } from 'network/shapes/Kami/types';
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
    getKamiLocation: (kamiIndex: EntityIndex) => number | undefined;
    getBaseKami: (kamiIndex: EntityIndex) => BaseKami;
  };
}

export const Grid = (props: Props) => {
  const { index, zone, rooms, actions, utils, accountKamis } = props;
  const {
    queryNodeKamis,
    queryAccountsByRoom,
    setHoveredRoom,
    queryKamisByAccount,
    getKamiLocation,
    getBaseKami,
  } = utils;
  const [grid, setGrid] = useState<Room[][]>([]);
  const [kamis, setKamis] = useState<EntityIndex[]>([]);
  const [players, setPlayers] = useState<EntityIndex[]>([]);
  const [harvestMap, setHarvestMap] = useState<Map<number, string[]>>(new Map());

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
    const newHarvestMap = new Map<number, string[]>();
    queryKamisByAccount().forEach((accountKami) => {
      const kamiLocation = getKamiLocation(accountKami);
      if (kamiLocation !== undefined) {
        const kamiNames = newHarvestMap.get(kamiLocation) ?? [];
        kamiNames.push(getBaseKami(accountKami).name);
        newHarvestMap.set(kamiLocation, kamiNames);
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
  const showKamisString = (roomIndex: number) => {
    const harvestMapNames = harvestMap.get(roomIndex);
    let res = null;
    if (harvestMapNames !== undefined) {
      harvestMapNames.length > 1
        ? (res = `${harvestMapNames.slice(0, -1).join(',') + ' and ' + harvestMapNames.slice(-1)} are Harvesting on this tile`)
        : (res = `${harvestMapNames} is Harvesting on this tile`);
    }
    return res;
  };
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
              const kamiBackGround =
                room?.index !== undefined && harvestMap.get(room.index) ? true : false;

              let backgroundColor;
              let onClick: MouseEventHandler | undefined;
              if (isCurrRoom) {
                backgroundColor = 'rgba(51,187,51,0.9)';
              } else if (isBlocked) {
                backgroundColor = 'rgba(0,0,0,0.3)';
              } else if (isExit) {
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
                  {kamiBackGround && (
                    <KamiAndShadow>
                      <KamiImage />
                      <KamiShadow />
                    </KamiAndShadow>
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
                  showKamisString(room.index),
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

const KamiImage = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  width: 100%;
  position: relative;
  background-image: url(${kamiIcon});
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  animation: 2s infinite alternate floating;
  animation-timing-function: linear;

  z-index: 2;
  @keyframes floating {
    0% {
      transform: translatey(-50%);
    }

    50% {
      transform: translatey(-40%);
    }
    100% {
      transform: translatey(-50%);
    }
  }
`;
const KamiShadow = styled.div`
  position: absolute;
  height: 20%;
  position: relative;
  animation: 2s infinite alternate shadow;
  animation-timing-function: linear;

  @keyframes shadow {
    0% {
      width: 25%;
      box-shadow: 0px -15px 7px rgba(0, 0, 0, 0.9);
    }
    50% {
      width: 33%;
      box-shadow: 0px -15px 6.8px rgba(0, 0, 0, 1);
    }
    100% {
      width: 30%;
      box-shadow: 0px -15px 7px rgba(0, 0, 0, 0.9);
    }
  }
`;

const KamiAndShadow = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;
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
