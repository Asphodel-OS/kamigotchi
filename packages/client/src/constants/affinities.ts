import { eerieIcon, insectIcon, normalIcon, scrapIcon } from 'assets/images/icons/affinities';

export enum Affinity {
  Normal = 'Normal',
  Eerie = 'Eerie',
  Insect = 'Insect',
  Scrap = 'Scrap',
}

export const AffinityColors = {
  normal: '#F2F4FF',
  eerie: '#B575D0',
  insect: '#A1C181',
  scrap: '#D38D50',
};

export const AffinityIcons = {
  eerie: eerieIcon,
  normal: normalIcon,
  scrap: scrapIcon,
  insect: insectIcon,
};
