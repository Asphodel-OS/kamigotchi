import { HelpMenuIcons } from 'assets/images/help';
import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { Room } from 'network/shapes/Room';
import { getAffinityImage } from 'network/shapes/utils';
import { useEffect, useMemo, useState } from 'react';
import { FloatingOnMap } from './FloatingOnMap';

type Mode = 'RoomType' | 'KamiCount' | 'OperatorCount' | 'MyKamis';

interface Props {
  optionSelected: Mode;
  roomIndex: number;
  yourKamiIconsMap: Map<number, string[]>;
  getNode: (index: number) => { affinity: string };
  rooms: Map<number, Room>;
  tick?: number;
  queryNodeByIndex: (index: number) => any;
  queryNodeKamis: (nodeEntity: any) => any;
  queryRoomAccounts: (roomIndex: number) => any;
}

export const GridFilter = (props: Props) => {
  const {
    optionSelected,
    roomIndex,
    yourKamiIconsMap,
    getNode,
    rooms,
    tick,
    queryNodeByIndex,
    queryNodeKamis,
    queryRoomAccounts,
  } = props;

  const [kamiAverage, setKamiAverage] = useState(0);
  const [operatorAverage, setOperatorAverage] = useState(0);

  useEffect(() => {
    calculateAverages();
  }, [rooms, tick]);

  // used rooms so it executes quick the first time
  const kamiCountMap = useMemo(() => {
    const map = new Map<number, number>();
    rooms.forEach((room) => {
      if (!room.index) return;
      const nodeEntity = queryNodeByIndex(room.index);
      const kamisInNode = queryNodeKamis(nodeEntity);
      map.set(room.index, kamisInNode.length);
    });
    return map;
  }, [tick, rooms]);

  const operatorCountMap = useMemo(() => {
    const map = new Map<number, number>();
    rooms.forEach((room) => {
      if (!room.index) return;
      const playersInRoom = queryRoomAccounts(room.index);
      map.set(room.index, playersInRoom.length);
    });
    return map;
  }, [tick, rooms]);

  // calculates averages to use for the coloring of the icons (kami and operator)
  const calculateAverages = () => {
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

    setKamiAverage(totalKamis / roomsWithKamis);
    setOperatorAverage(totalPlayers / roomsWithPlayers);
  };

  const getColor = (value: number, average: number) => {
    if (value > 4 * average) return -40; // red, high count;
    if (value >= 1.5 * average)
      return 10; // yellow, equal or above average but not high count
    else return 0; // no color, below average
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
