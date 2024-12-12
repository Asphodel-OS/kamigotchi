import {
  HarmonyIcon,
  HealthIcon,
  PowerIcon,
  SlotsIcon,
  ViolenceIcon,
} from 'assets/images/icons/stats';

export const StatDescriptions = {
  health: 'defines how resilient a Kami is to accumulated damage',
  power: 'determines the potential rate at which MUSU can be farmed',
  violence: 'dictates the threshold at which a Kami can liquidate others',
  harmony: 'divines resting recovery rate and defends against violence',
  slots: 'room for upgrades ^_^',
};

export const StatColors = {
  health: '#D7BCE8',
  power: '#F9DB6D',
  violence: '#BD4F6C',
  harmony: '#9CBCD2',
};

export const StatIcons = {
  health: HealthIcon,
  power: PowerIcon,
  violence: ViolenceIcon,
  harmony: HarmonyIcon,
  slots: SlotsIcon,
};
