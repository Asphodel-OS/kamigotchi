import { EntityID, EntityIndex } from '@mud-classic/recs';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { TextTooltip } from 'app/components/library';
import { mapBackgrounds } from 'assets/images/map';
import { Zones } from 'constants/zones';
import { Allo } from 'network/shapes/Allo';
import { Condition } from 'network/shapes/Conditional';
import { BaseKami } from 'network/shapes/Kami/types';
import { Node } from 'network/shapes/Node';
import { NullRoom, Room } from 'network/shapes/Room';
import { DetailedEntity } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { FloatingMapKami } from './FloatingMapKami';
import { GridTooltip } from './GridTooltip';
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
    queryNodeByIndex: (index: number) => EntityIndex;
    queryNodeKamis: (nodeEntity: EntityIndex) => EntityIndex[];
    queryRoomAccounts: (roomIndex: number) => EntityIndex[];
    getNode: (index: number) => Node;
    parseAllos: (scavAllo: Allo[]) => DetailedEntity[];
    queryScavInstance: (index: number, holderID: EntityID) => EntityIndex | undefined;
    getValue: (entity: EntityIndex) => number;
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
    getNode,
    parseAllos,
    queryScavInstance,
    getValue,
  } = utils;

  const [kamiEntities, setKamiEntities] = useState<EntityIndex[]>([]);
  const [playerEntities, setPlayerEntities] = useState<EntityIndex[]>([]);

  const rolls = useMemo(() => {
    const map = new Map<number, number>();
    rooms.forEach((room) => {
      if (!room.index) return;
      const instanceEntity = queryScavInstance(room.index, account.id);
      const cost = getNode(room.index).scavenge?.cost ?? 0;
      if (instanceEntity) {
        const currPoints = getValue(instanceEntity);
        map.set(room.index, Math.floor(currPoints / cost));
      } else {
        map.set(room.index, 0);
      }
    });
    return map;
  }, [rooms, account.id]);

  // set the grid whenever the room zone changes
  const grid = useMemo(() => {
    const dimensions = Zones[zone];
    if (!dimensions) return [];
    // create each row
    const grid = Array.from({ length: dimensions.height }, () =>
      Array(dimensions.width).fill(NullRoom)
    );
    // push the rooms into their respective locations
    const offset = dimensions.offset;
    for (const room of rooms.values()) {
      const { x, y } = room.location;
      grid[y - offset.y][x - offset.x] = room;
    }
    return grid;
  }, [zone, rooms]);

  const kamiIconsMap = useMemo(() => {
    const map = new Map<number, string[]>();
    accountKamis.forEach((kami) => {
      const location = getKamiLocation(kami);
      if (!location) return;
      if (!map.has(location)) map.set(location, []);
      map.get(location)!.push(getKami(kami).image);
    });
    return map;
  }, [accountKamis]);

  /////////////////
  // INTERPRETATION
  const isRoomBlocked = (room: Room) => !passesConditions(account, room.gates);

  const currExit = (room: Room) =>
    rooms.get(roomIndex)?.exits?.some((e) => e.toIndex === room.index);

  const getTileColor = (room: Room) => {
    if (!room.index) return;
    if (room.index === roomIndex) return 'rgba(51,187,51,0.9)';
    if (!currExit(room)) return;
    return isRoomBlocked(room) ? 'rgba(0,0,0,0.3)' : 'rgba(255,136,85,0.6)';
  };

  /////////////////
  // INTERACTION

  const handleRoomMove = (roomIndex: number) => {
    playClick();
    actions.move(roomIndex);
  };

  // updates the stats for a room and set it as the hovered room
  const updateRoomStats = (roomIndex: number) => {
    if (!roomIndex) return;
    setPlayerEntities(queryRoomAccounts(roomIndex));
    setKamiEntities(queryNodeKamis(queryNodeByIndex(roomIndex)));
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
              const backgroundColor = getTileColor(room);
              return (
                <TextTooltip
                  key={j}
                  text={
                    room.index
                      ? [
                          <GridTooltip
                            room={room}
                            rolls={rolls}
                            kamiIconsMap={kamiIconsMap}
                            getNode={getNode}
                            parseAllos={parseAllos}
                            playerEntitiesLength={playerEntities.length}
                            kamiEntitiesLength={kamiEntities.length}
                            friendsCount={account?.friends?.friends?.length ?? 0}
                          />,
                        ]
                      : []
                  }
                  title={`${room.name}${isRoomBlocked(room) ? ' (blocked)' : ''}`}
                  maxWidth={25}
                  grow
                >
                  <Tile
                    key={j}
                    backgroundColor={backgroundColor}
                    onClick={() =>
                      currExit(room) && !isRoomBlocked(room) && handleRoomMove(room.index)
                    }
                    hasRoom={room.index !== 0}
                    isHighlighted={!!backgroundColor}
                    onMouseEnter={() => updateRoomStats(room.index)}
                  >
                    {kamiIconsMap.has(room.index) && <FloatingMapKami />}
                  </Tile>
                </TextTooltip>
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
  flex-direction: column;
  user-select: none;
`;

const Background = styled.img`
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-grow: 1;
`;

const Tile = styled.div<{ hasRoom: boolean; isHighlighted: boolean; backgroundColor: any }>`
  border-left: 0.01vw solid rgba(0, 0, 0, 0.2);
  border-bottom: 0.01vw solid rgba(0, 0, 0, 0.2);
  background-color: ${({ backgroundColor }) => backgroundColor};
  display: flex;
  flex-grow: 1;
  align-items: stretch;
  justify-content: stretch;
  ${({ hasRoom }) =>
    hasRoom &&
    ` &:hover {
      opacity: 0.9;
      cursor: pointer;
      border-left-color: rgba(0, 0, 0, 1);
      border-bottom-color: rgba(0, 0, 0, 1);
      background-color: rgba(255, 255, 255, 0.3);
    }
  `}
  ${({ isHighlighted }) =>
    isHighlighted &&
    `opacity: 0.9;
    border-left-color: rgba(0, 0, 0, 1);
    border-bottom-color: rgba(0, 0, 0, 1);
  `}
`;
