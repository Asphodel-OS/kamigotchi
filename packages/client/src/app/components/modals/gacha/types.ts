import { kamiIcon } from 'assets/images/icons/menu';
import { StatIcons } from 'constants/stats';

export type TabType = 'MINT' | 'REROLL' | 'REVEAL';
export const TABS: TabType[] = ['MINT', 'REROLL', 'REVEAL'];

export type Stat = 'INDEX' | 'LEVEL' | 'HEALTH' | 'POWER' | 'VIOLENCE' | 'HARMONY' | 'SLOTS';

export interface Sort {
  field: Stat;
  order: 'ASC' | 'DESC';
}

export interface Filter {
  field: Stat;
  icon: string;
  min: number;
  max: number;
}

export const DefaultFilters: Filter[] = [
  { field: 'LEVEL', icon: kamiIcon, min: 1, max: 30 },
  { field: 'HEALTH', icon: StatIcons.health, min: 50, max: 400 },
  { field: 'POWER', icon: StatIcons.power, min: 10, max: 50 },
  { field: 'VIOLENCE', icon: StatIcons.violence, min: 10, max: 50 },
  { field: 'HARMONY', icon: StatIcons.harmony, min: 10, max: 50 },
  { field: 'SLOTS', icon: StatIcons.slots, min: 10, max: 50 },
];
