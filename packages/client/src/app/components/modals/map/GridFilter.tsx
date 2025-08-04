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

  const getColor = (value: number, average: number) => {
    if (value > 4 * average) return -40; // red, high count;
    if (value >= 1.5 * average) return 10; // yellow, equal or above average but not high count
    return 0; // no color, below average
  };

  let color = 0;
  if (optionSelected === 'KamiCount') {
    color = getColor(kamiCountMap.get(roomIndex) ?? 0, kamiAverage);
  } else if (optionSelected === 'OperatorCount') {
    color = getColor(operatorCountMap.get(roomIndex) ?? 0, operatorAverage);
  }

  const iconMap: Record<Mode, string | null> = {
    MyKamis: yourKamiIconsMap.has(roomIndex) && KamiIcon,
    RoomType: getAffinityImage(getNode(roomIndex).affinity),
    KamiCount: kamiCountMap.has(roomIndex) && HelpMenuIcons.kamis,
    OperatorCount: operatorCountMap.has(roomIndex) && OperatorIcon,
  };

  let icon = roomIndex !== 0 && iconMap[optionSelected];
  if (!icon) return null;

  return <FloatingOnMap icon={icon} color={color} />;
};
