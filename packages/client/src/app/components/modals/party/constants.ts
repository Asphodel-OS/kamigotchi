import { KamiIcon } from 'assets/images/icons/menu';
import { TraitIcons } from 'assets/images/icons/traits';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { StatIcons } from 'constants/stats';
import { Sort, View } from './types';

export const SortIcons: Record<Sort, string> = {
  name: KamiIcon,
  state: StatIcons.health,
  traits: TraitIcons.hand,
};

export const ViewIcons: Record<View, string> = {
  collapsed: TriggerIcons.eyeHalf,
  expanded: TriggerIcons.eyeOpen,
  external: TriggerIcons.eyeClosed,
};
