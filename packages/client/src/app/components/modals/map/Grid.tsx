import { EntityIndex } from '@mud-classic/recs';
import { MouseEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { Tooltip } from 'app/components/library';
import { mapBackgrounds } from 'assets/images/map';
import { Zones } from 'constants/zones';
import { Condition } from 'network/shapes/Conditional';
import { BaseKami } from 'network/shapes/Kami/types';
import { NullRoom, Room } from 'network/shapes/Room';
import { playClick } from 'utils/sounds';
import { FloatingMapKami } from './FloatingMapKami';

const KamiNames: Map<number, string[]> = new Map<number, string[]>();

interface Props {
  data: {
    account: Account;
    accountKamis: EntityIndex[];
    rooms: Map<number, Room>;
    roomIndex: number; // index of current room
    zone: number;
  };
  actions: {
    move: (roomIndex: number) => void;
  };
  utils: {
    getKami: (entity: EntityIndex) => BaseKami;
    getKamiLocation: (entity: EntityIndex) => number | undefined;
    passesConditions: (account: Account, gates: Condition[]) => boolean;
    queryAccountKamis: () => EntityIndex[];
    queryNodeByIndex: (index: number) => EntityIndex;
    queryNodeKamis: (nodeEntity: EntityIndex) => EntityIndex[];
    queryRoomAccounts: (roomIndex: number) => EntityIndex[];
  };
}

export const Grid = (props: Props) => {
  const { data, actions, utils } = props;
  const { account, roomIndex, zone, rooms, accountKamis } = data;
  const {
    getKamiLocation,
    getKami,
    passesConditions,
    queryNodeByIndex,
    queryNodeKamis,
    queryRoomAccounts,
  } = utils;

  const [grid, setGrid] = useState<Room[][]>([]);
  const [kamiEntities, setKamiEntities] = useState<EntityIndex[]>([]);
  const [playerEntities, setPlayerEntities] = useState<EntityIndex[]>([]);

  // set the grid whenever the room zone changes
  useEffect(() => {
    const dimensions = Zones[zone];
    if (!dimensions) {
      setGrid([]);
      return;
    }

    // create each row
    const grid = new Array<Room[]>();
    for (let i = 0; i < dimensions.height; i++) {
      grid[i] = new Array<Room>(dimensions.width);
      grid[i].fill(NullRoom);
    }

    // push the rooms into their respective locations
    const offset = dimensions.offset;
    for (const [_, room] of rooms) {
      grid[room.location.y - offset.y][room.location.x - offset.x] = room;
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
        kamiNames.push(getKami(accountKami).name);
        KamiNames.set(kamiLocation, kamiNames);
      }
    });
  }, [accountKamis]);

  /////////////////
  // INTERPRETATION

  const getKamiString = (roomIndex: number) => {
    const names = KamiNames.get(roomIndex);
    let text = '';
    if (names !== undefined) {
      names.length > 1
        ? (text = `${names.slice(0, -1).join(', ') + ' and ' + names.slice(-1)} are `)
        : (text = `${names} is `);
      text += 'Harvesting on this tile.';
    }
    return text;
  };

  const getTooltip = (room: Room) => {
    if (room.index === 0) return [];
    const isBlocked = isRoomBlocked(room);
    const name = `${room.name} ${isBlocked ? '(blocked)' : ''}`;
    return [
      name,
      '',
      room.description,
      '',
      `${playerEntities.length} players on this tile`,
      `${kamiEntities.length} kamis harvesting`,
      getKamiString(room.index),
    ];
  };

  const isRoomBlocked = (room: Room) => {
    return !passesConditions(account, room.gates);
  };

  /////////////////
  // INTERACTION

  const handleRoomMove = (roomIndex: number) => {
    playClick();
    actions.move(roomIndex);
  };

  // updates the stats for a room and set it as the hovered room
  const updateRoomStats = (roomIndex: number) => {
    if (roomIndex != 0) {
      setPlayerEntities(queryRoomAccounts(roomIndex));
      const nodeEntity = queryNodeByIndex(roomIndex);
      setKamiEntities(queryNodeKamis(nodeEntity));
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
              const isCurrRoom = room.index == roomIndex;
              const currExit = rooms.get(roomIndex)?.exits?.find((e) => e.toIndex === room.index);
              const isExit = !!currExit;

              const isBlocked = isRoomBlocked(room); // blocked exit

              let backgroundColor;
              let onClick: MouseEventHandler | undefined;
              if (isCurrRoom) backgroundColor = 'rgba(51,187,51,0.9)';
              else if (isBlocked) backgroundColor = 'rgba(0,0,0,0.3)';
              else if (isExit) {
                backgroundColor = 'rgba(255,136,85,0.6)';
                onClick = () => handleRoomMove(room?.index ?? 0);
              }

              return (
                <Tooltip key={j} text={getTooltip(room)} grow>
                  <Tile
                    key={j}
                    backgroundColor={backgroundColor}
                    onClick={onClick}
                    hasRoom={isRoom}
                    isHighlighted={isCurrRoom || isExit}
                    onMouseEnter={() => updateRoomStats(room.index)}
                  >
                    {!!KamiNames.has(room.index) && <FloatingMapKami />}
                  </Tile>
                </Tooltip>
              );
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
  border-left: 0.01vw solid rgba(0, 0, 0, 0.2);
  border-bottom: 0.01vw solid rgba(0, 0, 0, 0.2);
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
      border-left: 0.01vw solid rgba(0, 0, 0, 1);
      border-bottom: 0.01vw solid rgba(0, 0, 0, 1);
      background-color: rgba(255, 255, 255, 0.3);
    }
  `}

  ${({ isHighlighted }) =>
    isHighlighted &&
    `
    opacity: 0.9;
    border-left: 0.01vw solid rgba(0, 0, 0, 1);
    border-bottom: 0.01vw solid rgba(0, 0, 0, 1);
 
  `}

  ${({ onClick }) =>
    onClick &&
    `
    &:hover {
      cursor: pointer;
    }
  `}
`;
