import FilterListIcon from '@mui/icons-material/FilterList';
import { EntityID, EntityIndex } from 'engine/recs';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Account } from 'app/cache/account';
import { TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { triggerNodeModal } from 'app/triggers';
import { HelpMenuIcons } from 'assets/images/help';
import { insectIcon } from 'assets/images/icons/affinities';
import { ExclamIcon, KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { StaminaIcon } from 'assets/images/icons/stats';
import { mapBackgrounds } from 'assets/images/map';
import { Zones } from 'constants/zones';
import { Allo } from 'network/shapes/Allo';
import { BaseKami } from 'network/shapes/Kami/types';
import { Node } from 'network/shapes/Node';
import { checkQuestObjective, getQuest, queryOngoingQuests } from 'network/shapes/Quest';
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
  data: { account, accountKamis, rooms, roomIndex, zone, isViewingDifferentZone = false },
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
    isViewingDifferentZone?: boolean;
  };
  state: { tick: number };
  utils: {
    getKami: (entity: EntityIndex) => BaseKami;
    getKamiLocation: (entity: EntityIndex) => number | undefined;
    canEnterRoom: (room: Room) => boolean;
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
    canEnterRoom,
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

  // rooms targeted by ongoing quest objectives — the map should show where to go
  const questTargetMap = useMemo(() => {
    const map = new Map<number, string[]>();
    if (!account?.id) return map;
    const { world, components } = network;
    queryOngoingQuests(components, account.id).forEach((entity) => {
      const quest = getQuest(world, components, entity);
      if (quest.complete) return;
      quest.objectives.forEach((obj) => {
        if (obj.target?.type !== 'ROOM' || !obj.target.index) return;
        // a finished step of a multi-objective quest shouldn't keep its room marked
        if (checkQuestObjective(world, components, obj, quest, account).completable) return;
        const names = map.get(obj.target.index) ?? [];
        if (!names.includes(quest.name)) names.push(quest.name);
        map.set(obj.target.index, names);
      });
    });
    return map;
  }, [network, account?.id, tick]);

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

  // Open the context menu when right-clicking a room tile
  // Prevents opening menu on current room or empty tiles
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

  // Queue moves along the shortest path to the target room
  // Skips first element (current position) and enqueues remaining path
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
    return !canEnterRoom(room);
  };

  // check if a room is an exit from another room
  const currExit = (room: Room) => {
    return rooms.get(roomIndex)?.exits?.some((e) => e.toIndex === room.index);
  };

  // get the color of a room tile
  // (quest targets deliberately get no tint — the pulsing ! marker carries it,
  // a color wash fights the pixel art underneath)
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
    const options = [];

    // pathfinding only applies to the zone the player is standing in
    if (!isViewingDifferentZone) {
      const pathResult = findPath(world, components, roomIndex, room.index);
      const staminaCost = pathResult.reachable ? calculatePathStaminaCost(pathResult.distance) : -1;
      const canTravel =
        room.index !== roomIndex && staminaCost >= 0 && account.stamina.total >= staminaCost;

      options.push({
        text: `Auto Travel (${staminaCost >= 0 ? staminaCost : '?'})`,
        onClick: () => handleAutoTravel(room),
        image: StaminaIcon,
        disabled: !canTravel || !pathResult.reachable || pathResult.distance <= 1,
      });
    }

    // rooms without a harvesting node have nothing to show
    if (queryNodeByIndex(room.index)) {
      options.push({
        text: 'Show Node',
        onClick: () => triggerNodeModal(room.index),
        disabled: false,
      });
    }

    options.push({
      text: 'Cancel',
      onClick: () => setContextMenu(null),
      disabled: false,
    });

    return options;
  }, [contextMenu, network, roomIndex, account.stamina.total, handleAutoTravel, isViewingDifferentZone]);

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
              images: [FilterListIcon],
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
                  title={`${room.name}${isRoomBlocked(room) ? ' (blocked)' : ''}${
                    questTargetMap.has(room.index) ? ' — ❗' : ''
                  }`}
                  maxWidth={25}
                  grow
                >
                  <Tile
                    key={j}
                    backgroundColor={backgroundColor}
                    onClick={() => {
                      // walking a tile only applies to the zone the player is standing in
                      if (!isViewingDifferentZone && room.index !== 0 && !isRoomBlocked(room)) {
                        handleRoomMove(room.index);
                      }
                    }}
                    onContextMenu={(e) => handleRightClick(e, room)}
                    hasRoom={room.index !== 0}
                    isHighlighted={!!backgroundColor}
                    onMouseEnter={() => updateRoomStats(room.index)}
                  >
                    {questTargetMap.has(room.index) && room.index !== roomIndex && (
                      <QuestMarker>
                        <MarkerIcon src={ExclamIcon} alt='' />
                        {questTargetMap.get(room.index)!.length > 1
                          ? `×${questTargetMap.get(room.index)!.length}`
                          : ''}
                      </QuestMarker>
                    )}
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

const QuestMarker = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.1vw;

  color: #ffcc33;
  font-size: 1.5vw;
  font-weight: 900;
  line-height: 1;
  text-shadow:
    -0.09vw 0 0 #000,
    0.09vw 0 0 #000,
    0 -0.09vw 0 #000,
    0 0.09vw 0 #000,
    -0.09vw -0.09vw 0 #000,
    0.09vw -0.09vw 0 #000,
    -0.09vw 0.09vw 0 #000,
    0.09vw 0.09vw 0 #000,
    0 0.16vw 0 #000;
  animation: questBounce 1.1s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;

  @keyframes questBounce {
    0%,
    100% {
      transform: translate(-50%, -50%) translateY(0);
    }
    50% {
      transform: translate(-50%, -50%) translateY(-0.16vw);
    }
  }
`;

// pixel-art source: keep edges crisp at any tile scale
const MarkerIcon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  display: block;
  image-rendering: pixelated;
`;

const Tile = styled.div<{ hasRoom: boolean; isHighlighted: boolean; backgroundColor: any }>`
  position: relative;
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
