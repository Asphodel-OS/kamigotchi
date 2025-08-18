import { HelpMenuIcons } from 'assets/images/help';
import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { getAffinityImage } from 'network/shapes/utils';
import { FloatingOnMap } from './FloatingOnMap';

type Mode = 'RoomType' | 'KamiCount' | 'OperatorCount' | 'MyKamis';

interface Props {
  data: {
    optionSelected: Mode;
    kamiCountMap: Map<number, number>;
    operatorCountMap: Map<number, number>;
    kamiAverage: number;
    operatorAverage: number;
    roomIndex: number;
    yourKamiIconsMap: Map<number, string[]>;
  };

  utils: {
    getNode: (index: number) => { affinity: string };
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
  } = data;

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
      MyKamis: yourKamiIconsMap.has(roomIndex) ? KamiIcon : null,
      RoomType: getAffinityImage(getNode(roomIndex).affinity),
      KamiCount: (kamiCountMap.get(roomIndex) ?? 0) > 0 ? HelpMenuIcons.kamis : null,
      OperatorCount: (operatorCountMap.get(roomIndex) ?? 0) > 0 ? OperatorIcon : null,
    };
    return roomIndex !== 0 ? map[optionSelected] : null;
  };

  const icon = getIcon();

  return icon ? <FloatingOnMap icon={icon} color={getColorForOption()} /> : null;
};
