import { KamiIcon } from 'assets/images/icons/menu';
import { StatIcons } from 'constants/stats';

export type TabType = 'MINT' | 'REROLL' | 'REVEAL';
export const TABS: TabType[] = ['MINT', 'REROLL', 'REVEAL'];

export type Stat = 'INDEX' | 'LEVEL' | 'HEALTH' | 'POWER' | 'VIOLENCE' | 'HARMONY' | 'SLOTS';

export interface Sort {
  field: Stat;
  icon: string;
  ascending: boolean;
}

export const DefaultSorts: Sort[] = [
  { field: 'INDEX', icon: KamiIcon, ascending: true },
  { field: 'LEVEL', icon: KamiIcon, ascending: true },
  { field: 'HEALTH', icon: StatIcons.health, ascending: false },
  { field: 'POWER', icon: StatIcons.power, ascending: false },
  { field: 'VIOLENCE', icon: StatIcons.violence, ascending: false },
  { field: 'HARMONY', icon: StatIcons.harmony, ascending: false },
  { field: 'SLOTS', icon: StatIcons.slots, ascending: false },
];

export interface Filter {
  field: Stat;
  icon: string;
  min: number;
  max: number;
}

export const DefaultFilters: Filter[] = [
  { field: 'LEVEL', icon: KamiIcon, min: 1, max: 30 },
  { field: 'HEALTH', icon: StatIcons.health, min: 50, max: 300 },
  { field: 'POWER', icon: StatIcons.power, min: 10, max: 50 },
  { field: 'VIOLENCE', icon: StatIcons.violence, min: 10, max: 50 },
  { field: 'HARMONY', icon: StatIcons.harmony, min: 10, max: 50 },
  { field: 'SLOTS', icon: StatIcons.slots, min: 0, max: 2 },
];

export const MYSTERY_KAMI_GIF = 'https://kamigotchi.nyc3.digitaloceanspaces.com/placeholder.gif';
