import { AdminAPI } from '../admin';
import { readFile } from './utils';

export async function initItems(api: AdminAPI) {
  const droptablesCSV = await readFile('items/Droptables.csv');
  const itemsCSV = await readFile('items/Items.csv');
  for (let i = 0; i < itemsCSV.length; i++) {
    const item = itemsCSV[i];
    const type = String(item['Type']).toUpperCase();
    // console.log(itemsCSV[i]);
    try {
      if (type === 'FOOD') await setFood(api, item);
      else if (type === 'REVIVE') await setRevive(api, item);
      else if (type === 'MISC') await setMisc(api, item);
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

async function setFood(api: AdminAPI, item: any) {
  await api.registry.item.create.food(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    Number(item['Health'] ?? 0),
    Number(item['XP'] ?? 0),
    item['MediaURI']
  );
}

async function setRevive(api: AdminAPI, item: any) {
  await api.registry.item.create.revive(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    Number(item['Health'] ?? 0),
    item['MediaURI']
  );
}

async function setMisc(api: AdminAPI, item: any) {
  await api.registry.item.create.consumable(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    item['miscCategory'],
    item['MediaURI']
  );
}

async function setLootbox(api: AdminAPI, item: any, droptables: any) {
  await api.registry.item.create.lootbox(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    [1, 2, 3],
    [9, 9, 7],
    item['MediaURI']
  );
  return; // using placeholder lootboxes for now. similar challenges in representation to rooms
  await api.registry.item.create.lootbox(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    droptables[Number(item['Droptable']) - 1]['Key'],
    droptables[Number(item['Droptable']) - 1]['Tier'],
    item['MediaURI']
  );
}
