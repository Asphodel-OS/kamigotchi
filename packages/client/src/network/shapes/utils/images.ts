import { FactionIcons } from 'assets/images/icons/factions';
import { ItemImages } from 'assets/images/items';
import { SkillImages } from 'assets/images/skills';
import { AffinityIcons } from 'constants/affinities';
import { StatIcons } from 'constants/stats';

export const getAffinityImage = (name: string) => {
  const key = cleanName(name) as keyof typeof AffinityIcons;
  if (!key) throw new Error(`No affinity image found for ${name}`);
  return AffinityIcons[key];
};

// TODO: need faction 'key' field on onchain shapes to parse Faction shapes correctly
export const getFactionImage = (name: string) => {
  if (name === 'Kamigotchi Tourism Agency') return FactionIcons.agency;
  const key = cleanName(name) as keyof typeof FactionIcons;
  if (!key) throw new Error(`No faction image found for ${name}`);
  return FactionIcons[key];
};

export const getItemImage = (name: string) => {
  const key = cleanName(name) as keyof typeof ItemImages;
  if (!key) throw new Error(`No item image found for ${name}`);
  return ItemImages[key];
};

export const getSkillImage = (name: string) => {
  const key = cleanName(name) as keyof typeof SkillImages;
  if (!key) throw new Error(`No skill image found for ${name}`);
  return SkillImages[key];
};

export const getStatImage = (name: string) => {
  const key = cleanName(name) as keyof typeof StatIcons;
  if (!key) throw new Error(`No stat image found for ${name}`);
  return StatIcons[key];
};

// clean the name up to image file name format
const cleanName = (name: string) => {
  if (!name) return '';
  name = name.toLowerCase();
  name = name.replaceAll(/ /g, '_').replaceAll(/-/g, '_');
  name = name.replaceAll('(', '').replaceAll(')', '');
  name = name.replaceAll(`'`, '').replaceAll(`’`, '');
  name = name.replaceAll('“', '').replaceAll('”', '').replaceAll(`"`, '');
  return name;
};
