import { ActionIcons } from 'assets/images/icons/actions';
import { KamiIcon } from 'assets/images/icons/menu';
import { TraitIcons } from 'assets/images/icons/traits';
import { StatIcons } from 'constants/stats';
import { Sort } from './types';

export const SortIcons: Record<Sort, string> = {
  index: ActionIcons.search,
  name: KamiIcon,
  state: StatIcons.health,
  body: TraitIcons.body,
  hands: TraitIcons.hand,
};

export const MoodLimits: Record<number, string> = {
  10: 'Terrified',
  20: 'Scared',
  40: 'Exhausted',
  60: 'Scared',
  80: 'Wary',
  100: 'Rested',
};
