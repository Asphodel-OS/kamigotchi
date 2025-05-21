import { ActionIcons } from 'assets/images/icons/actions';
import { KamiIcon } from 'assets/images/icons/menu';
import { TraitIcons } from 'assets/images/icons/traits';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { StatIcons } from 'constants/stats';
import { Sort, View } from './types';

export const SortIcons: Record<Sort, string> = {
  index: ActionIcons.search,
  name: KamiIcon,
  state: StatIcons.health,
  traits: TraitIcons.hand,
};

export const ViewIcons: Record<View, string> = {
  collapsed: TriggerIcons.eyeHalf,
  expanded: TriggerIcons.eyeOpen,
};

export const HarvestingMoods: Record<number, string> = {
  30: 'Terrified',
  60: 'Scared',
  80: 'Wary',
  100: 'Alert',
};

export const RestingMoods: Record<number, string> = {
  30: 'Exhausted',
  60: 'Tired',
  80: 'Relieved',
  100: 'Rested',
};
