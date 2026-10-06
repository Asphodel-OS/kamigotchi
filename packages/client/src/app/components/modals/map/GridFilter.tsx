import styled from 'styled-components';

import { HelpMenuIcons } from 'assets/images/help';
import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { getAffinityImage } from 'network/shapes/utils';
import { FloatingOnMap } from './FloatingOnMap';

type Mode = 'RoomType' | 'KamiCount' | 'OperatorCount' | 'MyKamis' | 'LevelGate';

interface Props {
  data: {
    optionSelected: Mode;
    kamiCountMap: Map<number, number>;
    operatorCountMap: Map<number, number>;
    kamiAverage: number;
    operatorAverage: number;
    roomIndex: number;
    yourKamiIconsMap: Map<number, string[]>;
    levelCapMap: Map<number, number>;
  };

  utils: {
    getNode: (index: number) => { affinity: string[] };
  };
}

export const GridFilter = (props: Props) => {
  const { data, utils } = props;
  const { getNode } = utils;
  const {
    optionSelected,
    roomIndex,
    yourKamiIconsMap,
    kamiCountMap,
    operatorCountMap,
    kamiAverage,
    operatorAverage,
    levelCapMap,
  } = data;

  if (optionSelected === 'LevelGate') {
    const cap = levelCapMap.get(roomIndex);
    if (!roomIndex || !cap) return null;
    const color = getCapColor(cap);
    return (
      <LevelTint $color={color}>
        <LevelBadge $color={color}>{cap}</LevelBadge>
      </LevelTint>
    );
  }

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

  const getIcon = (): string | string[] | null => {
    const map: Record<Mode, string | string[] | null> = {
      MyKamis: yourKamiIconsMap.has(roomIndex) ? KamiIcon : null,
      RoomType: getNode(roomIndex).affinity.map((aff) => getAffinityImage(aff)),
      KamiCount: (kamiCountMap.get(roomIndex) ?? 0) > 0 ? HelpMenuIcons.kamis : null,
      OperatorCount: (operatorCountMap.get(roomIndex) ?? 0) > 0 ? OperatorIcon : null,
      LevelGate: null,
    };
    return roomIndex !== 0 ? map[optionSelected] : null;
  };

  const icon = getIcon();

  return icon ? <FloatingOnMap icon={icon} color={getColorForOption()} /> : null;
};

// tint by protection tier: newbie ring, mid tier, anything higher
const getCapColor = (cap: number) => {
  if (cap <= 15) return '#6cc46c';
  if (cap <= 35) return '#f0a43c';
  return '#e0605a';
};

const LevelTint = styled.div<{ $color: string }>`
  position: absolute;
  inset: 0;
  background-color: ${({ $color }) => `${$color}59`};
  pointer-events: none;
  z-index: 1;
`;

// corner placement keeps the centered quest marker visible
const LevelBadge = styled.div<{ $color: string }>`
  position: absolute;
  right: 6%;
  bottom: 6%;
  padding: 0.15vw 0.3vw;
  border: 0.12vw solid #000;
  border-radius: 0.3vw;
  background-color: ${({ $color }) => $color};
  color: #fff;
  font-size: 0.8vw;
  line-height: 1;
  text-shadow: 0 0.08vw 0 #000;
`;
