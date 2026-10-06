import styled from 'styled-components';

import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { FloatingOnMap } from './FloatingOnMap';

type Mode = 'TypeDrop' | 'MyKamis' | 'Activity' | 'LevelGate';

const VIPP_INDEX = 2;

// activity icon hues by grade, as the old count views: 1 plain, 2 yellow (>= 1.5x avg), 3 red (>= 4x)
const ACTIVITY_HUES: (number | undefined)[] = [undefined, undefined, 10, -40];

export interface Activity {
  kamis: number;
  operators: number;
  kamiLevel: number;
  operatorLevel: number;
}

export interface NodeLook {
  affinityIcons: string[];
  yieldIndex: number;
  yieldImage: string;
}

interface Props {
  data: {
    optionSelected: Mode;
    roomIndex: number;
    yourKamiIconsMap: Map<number, string[]>;
    levelCapMap: Map<number, number>;
    nodeLookMap: Map<number, NodeLook>;
    activityMap: Map<number, Activity>;
  };
}

export const GridFilter = ({ data }: Props) => {
  const { optionSelected, roomIndex, yourKamiIconsMap, levelCapMap, nodeLookMap, activityMap } =
    data;
  if (!roomIndex) return null;

  if (optionSelected === 'LevelGate') {
    const cap = levelCapMap.get(roomIndex);
    if (cap === undefined) return null;
    const color = getCapColor(cap);
    return (
      <LevelTint $color={color}>
        {cap > 0 && <LevelBadge $color={color}>{cap}</LevelBadge>}
      </LevelTint>
    );
  }

  if (optionSelected === 'TypeDrop') {
    const look = nodeLookMap.get(roomIndex);
    if (!look) return null;
    const color = look.yieldIndex === VIPP_INDEX ? '#ee7b7b' : '#f2bf3a';
    const dual = look.affinityIcons.length > 1;
    return (
      <LevelTint $color={color}>
        {look.affinityIcons.map((icon, i) => (
          <TopLeftIcon key={i} src={icon} $slot={dual ? i + 1 : 0} />
        ))}
        {look.yieldImage && <BottomRightIcon src={look.yieldImage} />}
      </LevelTint>
    );
  }

  if (optionSelected === 'Activity') {
    const activity = activityMap.get(roomIndex);
    if (!activity) return null;
    return (
      <IconLayer>
        {activity.kamis > 0 && (
          <TopLeftIcon src={KamiIcon} $slot={0} $hue={ACTIVITY_HUES[activity.kamiLevel]} />
        )}
        {activity.operators > 0 && (
          <BottomRightIcon src={OperatorIcon} $hue={ACTIVITY_HUES[activity.operatorLevel]} />
        )}
      </IconLayer>
    );
  }

  return yourKamiIconsMap.has(roomIndex) ? <FloatingOnMap icon={KamiIcon} color={0} /> : null;
};

// tint by protection tier: ungated (tint only, no badge), newbie ring, mid tier, anything higher
const getCapColor = (cap: number) => {
  if (!cap) return '#9cc9f0';
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
  white-space: nowrap;
  text-shadow: 0 0.08vw 0 #000;
`;

// untinted layer for icon-only views
const IconLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
`;

// recolors an icon (same filter the old count views used); undefined keeps it as drawn
const hueFilter = (hue?: number) =>
  hue === undefined ? '' : `sepia(1) saturate(500%) hue-rotate(${hue}deg)`;

// top-left icon(s): slot 0 = single, 1/2 = two side by side (dual affinity)
const TopLeftIcon = styled.img<{ $slot: number; $hue?: number }>`
  position: absolute;
  top: 6%;
  left: ${({ $slot }) => ($slot === 2 ? '32%' : '5%')};
  width: ${({ $slot }) => ($slot === 0 ? '52%' : '38%')};
  ${({ $hue }) => ($hue === undefined ? '' : `filter: ${hueFilter($hue)};`)}
  pointer-events: none;
`;

// bottom-right icon, layered over the top-left one
const BottomRightIcon = styled.img<{ $hue?: number }>`
  position: absolute;
  right: 6%;
  bottom: 6%;
  width: 50%;
  filter: ${({ $hue }) => `${hueFilter($hue)} drop-shadow(0 0.08vw 0.1vw rgba(0, 0, 0, 0.45))`};
  pointer-events: none;
  z-index: 1;
`;
