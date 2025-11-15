import { EntityID, EntityIndex } from 'engine/recs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { triggerNodeModal } from 'app/triggers';
import { HelpMenuIcons } from 'assets/images/help';
import { ActionIcons } from 'assets/images/icons/actions';
import { insectIcon } from 'assets/images/icons/affinities';
import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { StaminaIcon } from 'assets/images/icons/stats';
import { mapBackgrounds } from 'assets/images/map';
import { Zones } from 'constants/zones';
import { Allo } from 'network/shapes/Allo';
import { Condition } from 'network/shapes/Conditional';
import { BaseKami } from 'network/shapes/Kami/types';
import { Node } from 'network/shapes/Node';
import { calculatePathStaminaCost, findPath, NullRoom, Room } from 'network/shapes/Room';
import { DetailedEntity } from 'network/shapes/utils';
import { playClick } from 'utils/sounds';
import { GridFilter } from './GridFilter';
import { GridTooltip } from './GridTooltip';
import { TileContextMenu } from './TileContextMenu';

type Mode = 'RoomType' | 'KamiCount' | 'OperatorCount' | 'MyKamis';

const options = [
  { text: 'My Kamis', img: KamiIcon, object: 'MyKamis' },
  { text: 'Room Type', img: insectIcon, object: 'RoomType' },
  { text: 'Kami Count', img: HelpMenuIcons.kamis, object: 'KamiCount' },
  { text: 'Operator Count', img: OperatorIcon, object: 'OperatorCount' },
];

export const Grid = ({
  data: { account, accountKamis, rooms, roomIndex, zone },
  actions: { move },
  state: { tick },
  utils,
  network,
}: {
  actions: {
    move: (roomIndex: number) => void;
  };
  data: {
    account: Account;
    accountKamis: EntityIndex[];
    rooms: Map<number, Room>;
    roomIndex: number; // index of current room
    zone: number;
  };
  state: { tick: number };
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
  network: {
    world: any;
    components: any;
  };
}) => {
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
  const [mode, setMode] = useState<Mode[]>(['MyKamis']);
  const [contextMenu, setContextMenu] = useState<{
    room: Room;
    position: { x: number; y: number };
  } | null>(null);

  // track the number of scavenge rolls are in each room
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

  // creates a map of the player kami on tiles
  // this is used to display the kami icons in the grid tooltip
  // and to filter the grid by kami count
  const yourKamiIconsMap = useMemo(() => {
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
  // INTERACTION

  // move the player to a room
  const handleRoomMove = (roomIndex: number) => {
    playClick();
    move(roomIndex);
  };

  // updates the stats for a room and set it as the hovered room
  const updateRoomStats = (roomIndex: number) => {
    if (!roomIndex) return;
    setPlayerEntities(queryRoomAccounts(roomIndex));
    setKamiEntities(queryNodeKamis(queryNodeByIndex(roomIndex)));
  };

  // set the view mode
  const setType = (option: Mode[]) => {
    setMode(option);
  };

  // handle right clicking a room tile
  const handleRightClick = useCallback(
    (event: React.MouseEvent, room: Room) => {
      event.preventDefault();
      if (!room.index || room.index === roomIndex) return;
      playClick();
      setContextMenu({
        room,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [roomIndex]
  );

  // handle auto-traveling to a room
  const handleAutoTravel = useCallback(
    (targetRoom: Room) => {
      const { world, components } = network;
      const pathResult = findPath(world, components, roomIndex, targetRoom.index);

      if (!pathResult.reachable || pathResult.path.length <= 1) return;

      pathResult.path.slice(1).forEach((nextRoomIndex) => {
        move(nextRoomIndex);
      });
    },
    [network, roomIndex, move]
  );

  /////////////////
  // INTERPRETATION

  // check if a room is blocked by gates (requirements)
  const isRoomBlocked = (room: Room) => {
    return !passesConditions(account, room.gates);
  };

  // check if a room is an exit from another room
  const currExit = (room: Room) => {
    return rooms.get(roomIndex)?.exits?.some((e) => e.toIndex === room.index);
  };

  // get the color of a room tile
  const getTileColor = (room: Room) => {
    if (!room.index) return;
    if (room.index === roomIndex) return 'rgba(51,187,51,0.9)';
    if (!currExit(room)) return;
    return isRoomBlocked(room) ? 'rgba(0,0,0,0.3)' : 'rgba(255,136,85,0.6)';
  };

  // get the context menu options for a room
  const contextMenuOptions = useMemo(() => {
    if (!contextMenu) return [];

    const { world, components } = network;
    const room = contextMenu.room;

    const pathResult = findPath(world, components, roomIndex, room.index);
    const staminaCost = pathResult.reachable ? calculatePathStaminaCost(pathResult.distance) : -1;
    const canTravel =
      room.index !== roomIndex && staminaCost >= 0 && account.stamina.total >= staminaCost;

    return [
      {
        text: `Auto Travel (${staminaCost >= 0 ? staminaCost : '?'})`,
        onClick: () => handleAutoTravel(room),
        image: StaminaIcon,
        disabled: !canTravel || !pathResult.reachable || pathResult.distance <= 1,
      },
      {
        text: 'Show Node',
        onClick: () => triggerNodeModal(room.index),
        disabled: false,
      },
      {
        text: 'Cancel',
        onClick: () => setContextMenu(null),
        disabled: false,
      },
    ];
  }, [contextMenu, network, roomIndex, account.stamina.total, handleAutoTravel]);

  // populate the GridFilter details for room stats
  const { kamiCountMap, operatorCountMap, kamiAverage, operatorAverage } = useMemo(() => {
    const kamiCountMap = new Map<number, number>();
    const operatorCountMap = new Map<number, number>();

    let totalKamis = 0;
    let roomsWithKamis = 0;
    let totalPlayers = 0;
    let roomsWithPlayers = 0;

    rooms.forEach((room) => {
      if (!room.index) return;

      const kamis = queryNodeKamis(queryNodeByIndex(room.index));
      kamiCountMap.set(room.index, kamis.length);
      if (kamis.length > 0) {
        totalKamis += kamis.length;
        roomsWithKamis++;
      }

      const players = queryRoomAccounts(room.index);
      operatorCountMap.set(room.index, players.length);
      if (players.length > 0) {
        totalPlayers += players.length;
        roomsWithPlayers++;
      }
    });
    return {
      kamiCountMap,
      operatorCountMap,
      kamiAverage: roomsWithKamis && totalKamis / roomsWithKamis,
      operatorAverage: roomsWithPlayers && totalPlayers / roomsWithPlayers,
    };
  }, [rooms, tick, queryNodeByIndex, queryNodeKamis, queryRoomAccounts]);

  /////////////////
  // RENDER

  return (
    <Container>
      <Background src={mapBackgrounds[zone]} />
      <Overlay>
        <DropdownWrapper>
          <DropdownToggle
            limit={33}
            button={{
              images: [ActionIcons.search],
              tooltips: ['Filter tile by Type'],
            }}
            onClick={[setType]}
            options={[options]}
            simplified
            radius={0.6}
          />
        </DropdownWrapper>
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
                            yourKamiIconsMap={yourKamiIconsMap}
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
                      room.index !== 0 && !isRoomBlocked(room) && handleRoomMove(room.index)
                    }
                    onContextMenu={(e) => handleRightClick(e, room)}
                    hasRoom={room.index !== 0}
                    isHighlighted={!!backgroundColor}
                    onMouseEnter={() => updateRoomStats(room.index)}
                  >
                    <GridFilter
                      data={{
                        optionSelected: mode[0],
                        roomIndex: room.index,
                        yourKamiIconsMap,
                        kamiCountMap,
                        operatorCountMap,
                        kamiAverage,
                        operatorAverage,
                      }}
                      utils={{ getNode }}
                    />
                  </Tile>
                </TextTooltip>
              );
            })}
          </Row>
        ))}
      </Overlay>
      {contextMenu && (
        <TileContextMenu
          options={contextMenuOptions}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
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

const DropdownWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  pointer-events: none;
`;
