// parse the description of a skill bonus from its components
// +10% Harvest Output Per Level
// [+]         [10 | 1.0]           [s | %]   [Harvest] [Output]  [Per Level]

import { Bonus } from './types';

// [logictype] [value/type/subtype] [subtype] [type]    [subtype] [constant]
export const parseBonusText = (bonus: Bonus): string => {
  let text = '';

  // number formatting
  if (bonus.type.includes('STAT')) text += bonus.value * 1;
  else if (bonus.type.startsWith('COOLDOWN')) text += `${bonus.value * 1}s`;
  else text += `${(bonus.value / 10).toFixed(1)}%`; // default %

  // type
  if (bonus.type.startsWith('STAT')) text += ` ${bonus.type.split('_')[1]}`;
  else if (bonus.type.endsWith('OFFENSE')) text += ` offensive ${bonus.type.slice(0, -7)}`;
  else if (bonus.type.endsWith('DEFENSE')) text += ` defensive ${bonus.type.slice(0, -7)}`;
  else text += ` ${bonus.type}`;

  // formatting
  text = text.toLowerCase().replaceAll('_', ' ');

  // replace contractions with full words
  text = text.replaceAll('atk', 'attack ');
  text = text.replaceAll('def', 'defense ');
  text = text.replaceAll('harv', 'harvest ');
  text = text.replaceAll('stnd', 'standard');

  if (bonus.endType) {
    text += ` [${parseEndtype(bonus)}]`;
  }

  return text;
};

const parseEndtype = (bonus: Bonus): string => {
  if (bonus.endType === 'TIMED') return 'for ' + bonus.duration + 's';
  else if (bonus.endType === 'UPON_HARVEST_ACTION') return 'till harvest action';
  else return '';
};
