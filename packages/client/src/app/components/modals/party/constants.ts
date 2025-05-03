import { ActionIcons } from 'assets/images/icons/actions';
import { CooldownIcon } from 'assets/images/icons/battles';
import { KamiIcon } from 'assets/images/icons/menu';
import { TraitIcons } from 'assets/images/icons/traits';
import { StatIcons } from 'constants/stats';
import { Sort } from './types';

export const SortIcons: Record<Sort, string> = {
  index: ActionIcons.search,
  name: KamiIcon,
  health: StatIcons.health,
  cooldown: CooldownIcon,
  body: TraitIcons.body,
  hands: TraitIcons.hand,
};
