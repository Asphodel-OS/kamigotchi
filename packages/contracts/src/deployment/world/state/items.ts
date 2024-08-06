import { AdminAPI } from '../admin';
import { getItemImage, readFile } from './utils';

export async function initItems(api: AdminAPI, overrideIndices?: number[]) {
  const droptablesCSV = await readFile('items/droptables.csv');
  const itemsCSV = await readFile('items/items.csv');

  const ignoreTypes = ['OTHER'];
  const baseTypes = ['MISC', 'MATERIAL', 'RING', 'KEY ITEM', 'NFT'];
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

    try {
      const type = String(item['Type']).toUpperCase();
      if (ignoreTypes.includes(type)) continue;

      if (baseTypes.includes(type)) await setBase(api, item);
      else if (type === 'CONSUMABLE') await setConsumable(api, item);
      else if (type === 'LOOTBOX') await setLootbox(api, item, droptablesCSV);
      else console.error('Item type not found: ' + type);
    } catch {
      console.error('Could not create item', item['Index']);
    }
  }
}

export async function deleteItems(api: AdminAPI, indices: number[]) {
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
      if (itemsCSV[i]['Status'] === 'Revise Deployment') indices.push(Number(itemsCSV[i]['Index']));
    }
  }

  await deleteItems(api, indices);
  await initItems(api, indices);
}

async function setBase(api: AdminAPI, item: any) {
  await api.registry.item.create.base(
    Number(item['Index']),
    item['Type'].toUpperCase(),
    item['Name'].trim(),
    item['Description'],
    getItemImage(item['Name'])
  );
}

async function setConsumable(api: AdminAPI, item: any) {
  await api.registry.item.create.consumable(
    Number(item['Index']),
    (item['For'] ?? 'KAMI').toUpperCase(),
    item['Name'].trim(),
    item['Description'],
    item['ConsumableType'].toUpperCase(),
    getItemImage(item['Name'])
  );
  await addStat(api, item);
}

async function setLootbox(api: AdminAPI, item: any, droptables: any) {
  await api.registry.item.create.lootbox(
    Number(item['Index']),
    item['Name'].trim(),
    item['Description'],
    [11001, 11002, 11006, 101, 102, 103, 106, 105, 104, 109, 108, 107, 110, 112, 113, 114, 115],
    [9, 9, 9, 9, 8, 7, 8, 7, 6, 9, 8, 7, 7, 6, 6, 6, 6],
    getItemImage(item['Name'])
  );
  return; // using placeholder lootboxes for now. similar challenges in representation to rooms
  await api.registry.item.create.lootbox(
    Number(item['Index']),
    item['Name'].trim(),
    item['Description'],
    droptables[Number(item['Droptable']) - 1]['Key'],
    droptables[Number(item['Droptable']) - 1]['Tier'],
    getItemImage(item['Name'])
  );
}

async function addStat(api: AdminAPI, item: any) {
  const index = Number(item['Index']);

  if (Number(item['XP']) > 0) await api.registry.item.add.stat(index, 'XP', Number(item['XP']));
  if (Number(item['Health']) > 0) {
    console.log('setting health', item['Health'], Number(item['Health']));
    await api.registry.item.add.stat(index, 'HEALTH', Number(item['Health']));
  }
  if (Number(item['MaxHealth']) > 0)
    await api.registry.item.add.stat(index, 'MAXHEALTH', Number(item['MaxHealth']));
  if (Number(item['Power']) > 0)
    await api.registry.item.add.stat(index, 'POWER', Number(item['Power']));
  if (Number(item['Violence']) > 0)
    await api.registry.item.add.stat(index, 'VIOLENCE', Number(item['Violence']));
  if (Number(item['Harmony']) > 0)
    await api.registry.item.add.stat(index, 'HARMONY', Number(item['Harmony']));
  if (Number(item['Stamina']) > 0)
    await api.registry.item.add.stat(index, 'STAMINA', Number(item['Stamina']));
}
