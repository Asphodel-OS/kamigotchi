import { AdminAPI } from '../../api';
import { parseKamiStateToIndex, stringToNumberArray } from '../utils';

const STAT_TOTALS = ['HEALTH', 'POWER', 'VIOLENCE', 'HARMONY', 'STAMINA'];
const STAT_POINTS = ['HP', 'SP'];

export async function addAllo(api: AdminAPI, itemIndex: number, entry: any) {
  const type = entry['Type'].toUpperCase();
  const alloAPI = api.registry.item.add.allo;

  if (type === 'STAT') addStat(alloAPI, itemIndex, entry);
  else if (type === 'BONUS') addBonus(alloAPI, itemIndex, entry);
  else if (type === 'FLAG') addFlag(alloAPI, itemIndex, entry);
  else if (type === 'STATE') addState(alloAPI, itemIndex, entry);
  else if (type === 'ITEM_DROPTABLE') addDroptable(alloAPI, itemIndex, entry);
  else addBasic(alloAPI, itemIndex, entry);
}

// add a basic allo to an item
async function addBasic(api: any, itemIndex: number, entry: any) {
  const type = entry['Type'].toUpperCase();
  const index = Number(entry['Index']);
  const value = Number(entry['Value']);
  console.log(`  adding basic allo ${type} ${index} ${value}`);
  await api.basic(itemIndex, 'USE', type, index, value);
}

// add a bonus allo to an item
async function addBonus(api: any, itemIndex: number, entry: any) {
  const descriptor = entry['Descriptor'].toUpperCase();
  const terminator = entry['Terminator'];
  const value = Number(entry['Value']);
  console.log(`  adding bonus allo ${descriptor} ${terminator} `);
  await api.bonus(itemIndex, 'USE', descriptor, terminator, 0, value);
}

// add a droptable allo to an item
async function addDroptable(api: any, itemIndex: number, entry: any) {
  const keys = stringToNumberArray(entry['DTIndices']);
  const weights = stringToNumberArray(entry['DTWeights']);
  console.log(`  adding droptable allo ${itemIndex}`);
  await api.droptable(itemIndex, 'USE', keys, weights, 1);
}

// add a flag allo to an item
async function addFlag(api: any, itemIndex: number, entry: any) {
  let flag = entry['Descriptor'].toUpperCase() as string;
  console.log(`  adding flag allo ${flag}`);
  let value = 1;
  if (flag.includes('_FALSE')) {
    value = 0;
    flag = flag.replace('_FALSE', '');
  }
  await api.basic(itemIndex, 'USE', `FLAG_${flag}`, 0, value);
}

// add a stat allo to an item
export async function addStat(api: any, itemIndex: number, entry: any) {
  const value = Number(entry['Value']);
  let statType = entry['Descriptor'].toUpperCase();
  console.log(`  adding stat allo ${statType} ${value}`);

  let stat = { base: 0, shift: 0, boost: 0, sync: 0 };
  if (STAT_TOTALS.includes(statType)) stat.shift = value;
  else if (STAT_POINTS.includes(statType)) stat.base = value;

  // convert stat to proper key
  if (statType === 'HP') statType = 'HEALTH';
  if (statType === 'SP') statType = 'STAMINA';

  await api.stat(itemIndex, 'USE', statType, stat.base, stat.shift, stat.boost, stat.sync);
}

// add a state allo to an item
async function addState(api: any, itemIndex: number, entry: any) {
  const index = parseKamiStateToIndex(entry['Descriptor']);
  console.log(`  adding state allo ${index}`);
  await api.basic(itemIndex, 'USE', `STATE`, index, 0);
}
