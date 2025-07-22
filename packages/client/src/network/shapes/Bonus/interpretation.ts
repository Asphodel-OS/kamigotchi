// parse the description of a skill bonus from its components
// +10% Harvest Output Per Level
// [+]         [10 | 1.0]           [s | %]   [Harvest] [Output]  [Per Level]

import { Bonus } from './types';

// [logictype] [value/type/subtype] [subtype] [type]    [subtype] [constant]
export const parseBonusText = (bonus: Bonus): string => {
  const value = bonus.value;
  const type = bonus.type;
  let text = value > 0 ? '+' : '';

  // number formatting
  if (type.includes('STAT')) text += value * 1;
  else if (type.includes('COOLDOWN')) text += `${value * 1}s`;
  else if (type.includes('INTENSITY')) text += `${value * 1}musu/hr`;
  else text += `${(value / 10).toFixed(1)}%`; // default %

  // type
  if (type.startsWith('STAT')) text += ` ${type.split('_')[1]}`;
  else if (type.endsWith('OFFENSE')) text += ` offensive ${type.slice(0, -7)}`;
  else if (type.endsWith('DEFENSE')) text += ` defensive ${type.slice(0, -7)}`;
  else text += ` ${type}`;

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
  else if (bonus.endType === 'UPON_HARVEST_ACTION') return 'til next action';
  else if (bonus.endType === 'UPON_DEATH') return 'til death';
  else if (bonus.endType === 'UPON_LIQUIDATION') return 'til kami liquidates';
  else return '';
};
