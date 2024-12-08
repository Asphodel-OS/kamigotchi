import { AdminAPI } from '../admin';
import { getItemImage, parseKamiStateToIndex, readFile, toDelete, toRevise } from './utils';

export async function initItems(api: AdminAPI, overrideIndices?: number[]) {
  const itemsCSV = await readFile('items/items.csv');

  for (let i = 0; i < itemsCSV.length; i++) {
    const item = itemsCSV[i];
    if (
      item['Status'] !== 'For Implementation' &&
      item['Status'] !== 'Revise Deployment' &&
      item['Status'] !== 'Ingame' // a lil clunky to accommodate notion
    )
      continue;
    // skip if indices are overridden and item isn't included
    if (overrideIndices && !overrideIndices.includes(Number(item['Index']))) continue;

    if (item['Class'] === 'ITEM') await createItem(api, item);
    else if (item['Class'] === 'EFFECT') await addAllo(api, item);
    try {
    } catch {
      console.error('Could not create item', item['Index']);
    }
  }
}

export async function deleteItems(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const itemsCSV = await readFile('items/items.csv');
    for (let i = 0; i < itemsCSV.length; i++) {
      if (toDelete(itemsCSV[i])) indices.push(Number(itemsCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      await api.registry.item.delete(indices[i]);
    } catch {
      console.error('Could not delete item ' + indices[i]);
    }
  }
}

export async function reviseItems(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const itemsCSV = await readFile('items/items.csv');
    for (let i = 0; i < itemsCSV.length; i++) {
      if (toRevise(itemsCSV[i])) indices.push(Number(itemsCSV[i]['Index']));
    }
  }

  await deleteItems(api, indices);
  await initItems(api, indices);
}

////////////////
// SHAPES

async function createItem(api: AdminAPI, entry: any) {
  const ignoreTypes = ['OTHER'];
  const baseTypes = ['MISC', 'MATERIAL', 'RING', 'KEY ITEM', 'NFT'];
  // const consumableTypes = ['FOOD', 'LOOTBOX', 'REVIVE', 'RENAME_POTION', 'TELEPORT', 'SKILL_RESET'];
  const consumableTypes = ['FOOD', 'LOOTBOX', 'REVIVE', 'CONSUMABLE'];

  const type = String(entry['Type']).toUpperCase();
  if (ignoreTypes.includes(type)) return;

  if (baseTypes.includes(type)) await setBase(api, entry);
  else if (consumableTypes.includes(type)) await setConsumable(api, entry);
  else console.error('Item type not found: ' + type);
}

async function addAllo(api: AdminAPI, entry: any) {
  if (entry['ConType'].toUpperCase() === 'ITEM_DROPTABLE') {
    const dt = parseDroptable(entry);
    await api.registry.item.add.allo.droptable(
      Number(entry['Index']),
      'USE',
      dt.key,
      dt.weights,
      dt.value
    );
  } else if (entry['ConType'].toUpperCase() === 'STAT') {
    const [statType, stat] = parseStat2(entry);
    await api.registry.item.add.allo.stat(
      Number(entry['Index']),
      'USE',
      statType,
      stat.base,
      stat.shift,
      stat.boost,
      stat.sync
    );
  } else {
    // basic (everything else)
    const [type, index, value] = parseBasic(entry);
    await api.registry.item.add.allo.basic(Number(entry['Index']), 'USE', type, index, value);
  }
}

/// @dev requirements depend on outdated item types (ie. FOOD, REVIVE, etc). to update
async function addRequirement(api: AdminAPI, item: any) {
  // only adds requirement from type for now. slightly hardcoded for state requirements
  if (item['For'].toUpperCase() !== 'KAMI') return; // only kami need state requirements

  const [type, logicType, index, value] = itemTypeToRequirement(item['Type'].toUpperCase());
  await api.registry.item.add.requirement(
    Number(item['Index']),
    'USE',
    type,
    logicType,
    index,
    value
  );
}

////////////////
// SUB-SHAPES

async function setBase(api: AdminAPI, entry: any) {
  await api.registry.item.create.base(
    Number(entry['Index']),
    entry['Type'].toUpperCase(),
    entry['Name'].trim(),
    entry['Description'],
    getItemImage(entry['Name'])
  );
}

async function setConsumable(api: AdminAPI, entry: any) {
  await api.registry.item.create.consumable(
    Number(entry['Index']),
    (entry['For'] ?? 'KAMI').toUpperCase(),
    entry['Name'].trim(),
    entry['Description'],
    entry['Type'].toUpperCase(),
    getItemImage(entry['Name'])
  );
  await addRequirement(api, entry); // hardcoded based on item types. to update
  // await addAllo(api, entry);
}

// async function addAllo(api: AdminAPI, item: any) {
//   const allos = getAlloInfo(item);
//   for (const allo of allos) {
//     if (allo.basic) {
//       await api.registry.item.add.allo.basic(
//         Number(item['Index']),
//         'USE',
//         allo.type,
//         allo.basic.index,
//         allo.basic.value
//       );
//     }
//     if (allo.droptable) {
//       await api.registry.item.add.allo.droptable(
//         Number(item['Index']),
//         'USE',
//         allo.droptable.key,
//         allo.droptable.weights,
//         allo.droptable.value
//       );
//     }
//     if (allo.stat) {
//       await api.registry.item.add.allo.stat(
//         Number(item['Index']),
//         'USE',
//         allo.type,
//         allo.stat.base,
//         allo.stat.shift,
//         allo.stat.boost,
//         allo.stat.sync
//       );
//     }
//   }
// }

/////////////////
// UTILS

type Basic = {
  index: number;
  value: number;
};

type Droptable = {
  key: number[];
  weights: number[];
  value: number;
};

type Stat = {
  base: number;
  shift: number;
  boost: number;
  sync: number;
};

type AlloData = {
  type: string;
  basic?: Basic;
  droptable?: Droptable;
  stat?: Stat;
};

function getAlloInfo(item: any): AlloData[] {
  const allos: AlloData[] = [];

  if (item['Type'].toUpperCase() === 'REVIVE')
    allos.push({ type: 'STATE', basic: { index: parseKamiStateToIndex('RESTING'), value: 0 } });
  if (item['Room'] > 0)
    allos.push({ type: 'ROOM', basic: { index: Number(item['Room']), value: 0 } });
  if (item['XP'] > 0) allos.push({ type: 'XP', basic: { index: 0, value: Number(item['XP']) } });
  if (item['Health'] > 0) allos.push(parseStat('HEALTH', Number(item['Health'])));
  if (item['MaxHealth'] > 0) allos.push(parseStat('MAXHEALTH', Number(item['MaxHealth'])));
  if (item['Power'] > 0) allos.push(parseStat('POWER', Number(item['Power'])));
  if (item['Violence'] > 0) allos.push(parseStat('VIOLENCE', Number(item['Violence'])));
  if (item['Harmony'] > 0) allos.push(parseStat('HARMONY', Number(item['Harmony'])));
  if (item['Stamina'] > 0) allos.push(parseStat('STAMINA', Number(item['Stamina'])));
  // if (item['UseFlags'] !== '') allos.push(parseFlag(item['UseFlags'].toUpperCase()));
  if (item['DTIndices'] !== '')
    allos.push({ type: 'ITEM_DROPTABLE', droptable: parseDroptable(item) });

  return allos;
}

function parseBasic(entry: any): [string, number, number] {
  // type, index, value
  let type = entry['ConType'].toUpperCase();
  let index = Number(entry['ConIndex']);
  let value = Number(entry['ConValue']);

  if (type === 'FLAG_') {
    [type, index, value] = parseFlag(entry['ConIndex'].toUpperCase());
  }

  return [type, index, value];
}

function parseDroptable(entry: any): Droptable {
  return {
    key: stringToNumberArray(entry['DTIndices']),
    weights: stringToNumberArray(entry['DTWeights']),
    value: 1,
  };
}

function parseFlag(flag: string): [string, number, number] {
  let value = 1;
  if (flag.includes('_FALSE')) {
    value = 0;
    flag = flag.replace('_FALSE', '');
  }
  return [`FLAG_${flag.toUpperCase()}`, 0, value];
  // return { type: `FLAG_${flag.toUpperCase()}`, basic: { index: 0, value: value } };
}

function parseStat(statType: string, value: number): AlloData {
  let stat: Stat = { base: 0, shift: 0, boost: 0, sync: 0 };
  if (statType === 'HEALTH') stat = { base: 0, shift: 0, boost: 0, sync: value } as Stat;
  else if (statType === 'MAXHEALTH') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'POWER') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'VIOLENCE') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'HARMONY') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'STAMINA') stat = { base: 0, shift: 0, boost: 0, sync: value } as Stat;

  if (statType === 'MAXHEALTH') statType = 'HEALTH';
  return { type: statType, stat: stat };
}

function parseStat2(entry: any): [string, Stat] {
  let statType = entry['ConIndex (String)'].toUpperCase();
  const value = Number(entry['ConValue']);
  let stat: Stat = { base: 0, shift: 0, boost: 0, sync: 0 };
  if (statType === 'HEALTH') stat = { base: 0, shift: 0, boost: 0, sync: value } as Stat;
  else if (statType === 'MAXHEALTH') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'POWER') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'VIOLENCE') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'HARMONY') stat = { base: 0, shift: value, boost: 0, sync: 0 } as Stat;
  else if (statType === 'STAMINA') stat = { base: 0, shift: 0, boost: 0, sync: value } as Stat;

  if (statType === 'MAXHEALTH') statType = 'HEALTH';
  return [statType, stat];
}

function itemTypeToRequirement(type: string): [string, string, number, number] {
  if (type === 'FOOD') return ['KAMI_CAN_EAT', 'BOOL_IS', 0, 0];
  else if (type === 'REVIVE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('DEAD'), 0];
  else if (type === 'RENAME_POTION')
    return ['STATE', 'BOOL_IS', parseKamiStateToIndex('RESTING'), 0];
  else if (type === 'SKILL_RESET') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('RESTING'), 0];
  else return ['', '', 0, 0];
}

function stringToNumberArray(rawStr: string): number[] {
  const str = rawStr.slice(1, -1);
  return str.split(',').map((s) => Number(s.trim()));
}
