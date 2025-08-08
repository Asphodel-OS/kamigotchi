import { HelpMenuIcons } from 'assets/images/help';
import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { Room } from 'network/shapes/Room';
import { getAffinityImage } from 'network/shapes/utils';
import { useEffect, useState } from 'react';
import { FloatingOnMap } from './FloatingOnMap';

type Mode = 'RoomType' | 'KamiCount' | 'OperatorCount' | 'MyKamis';

interface Props {
  data: {
    optionSelected: Mode;
    roomIndex: number;
    yourKamiIconsMap: Map<number, string[]>;
    rooms: Map<number, Room>;
  };
  state: { tick: number };
  utils: {
    getNode: (index: number) => { affinity: string };
    queryNodeByIndex: (index: number) => any;
    queryNodeKamis: (nodeEntity: any) => any;
    queryRoomAccounts: (roomIndex: number) => any;
  };
}

export const GridFilter = (props: Props) => {
  const { data, state, utils } = props;
  const { queryNodeByIndex, queryNodeKamis, queryRoomAccounts, getNode } = utils;
  const { optionSelected, roomIndex, yourKamiIconsMap, rooms } = data;
  const { tick } = state;

  const [kamiAverage, setKamiAverage] = useState(0);
  const [operatorAverage, setOperatorAverage] = useState(0);

  const [kamiCountMap, setKamiCountMap] = useState<Map<number, number>>(new Map());
  const [operatorCountMap, setOperatorCountMap] = useState<Map<number, number>>(new Map());

  // Calculate kamiCountMap when rooms or tick change
  useEffect(() => {
    const map = new Map<number, number>();
    rooms.forEach((room) => {
      if (!room.index) return;
      const nodeEntity = queryNodeByIndex(room.index);
      const kamisInNode = queryNodeKamis(nodeEntity);
      map.set(room.index, kamisInNode.length);
    });
    setKamiCountMap(map);
  }, [rooms, tick]);

  // used rooms so it executes quick the first time
  useEffect(() => {
    const map = new Map<number, number>();
    rooms.forEach((room) => {
      if (!room.index) return;
      const playersInRoom = queryRoomAccounts(room.index);
      map.set(room.index, playersInRoom.length);
    });
    setOperatorCountMap(map);
  }, [rooms, tick]);

  // calculates averages to use for the coloring of the icons (kami and operator)
  useEffect(() => {
    let totalKamis = 0;
    let roomsWithKamis = 0;
    let totalPlayers = 0;
    let roomsWithPlayers = 0;

    rooms.forEach((room) => {
      if (!room.index) return;

      const kamiCount = kamiCountMap.get(room.index) ?? 0;
      const playerCount = operatorCountMap.get(room.index) ?? 0;

      if (kamiCount > 0) {
        totalKamis += kamiCount;
        roomsWithKamis++;
      }
      if (playerCount > 0) {
        totalPlayers += playerCount;
        roomsWithPlayers++;
      }
    });

    setKamiAverage(roomsWithKamis > 0 ? totalKamis / roomsWithKamis : 0);
    setOperatorAverage(roomsWithPlayers > 0 ? totalPlayers / roomsWithPlayers : 0);
  }, [kamiCountMap, operatorCountMap]);

  const getColorForOption = (): number => {
    const getColor = (value: number, average: number) => {
      if (value > 4 * average) return -40; // red, high count;
      if (value >= 1.5 * average) return 10; // yellow, equal or above average but not high count
      return 0; // no color, below average
    };

    if (optionSelected === 'KamiCount') {
      return getColor(kamiCountMap.get(roomIndex) ?? 0, kamiAverage);
    }
    if (optionSelected === 'OperatorCount') {
      return getColor(operatorCountMap.get(roomIndex) ?? 0, operatorAverage);
    }
    return 0;
  };

  const getIcon = (): string | null => {
    const map: Record<Mode, string | null> = {
      MyKamis: yourKamiIconsMap.has(roomIndex) && KamiIcon,
      RoomType: getAffinityImage(getNode(roomIndex).affinity),
      KamiCount: (kamiCountMap.get(roomIndex) ?? 0) > 0 && HelpMenuIcons.kamis,
      OperatorCount: (operatorCountMap.get(roomIndex) ?? 0) > 0 && OperatorIcon,
    };

    return roomIndex !== 0 ? map[optionSelected] : null;
  };

  const icon = getIcon();

  return icon ? <FloatingOnMap icon={icon} color={getColorForOption()} /> : null;
};
