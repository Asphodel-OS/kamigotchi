import droptablesCSV from 'assets/data/items/droptables.csv';
import itemsCSV from 'assets/data/items/items.csv';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initItems(api: AdminAPI) {
  for (let i = 0; i < itemsCSV.length; i++) {
    await sleepIf();
    const item = itemsCSV[i];
    const type = item['Type'].toUpperCase();
    // console.log(itemsCSV[i]);
    try {
      if (type === 'FOOD') await setFood(api, item);
      else if (type === 'REVIVE') await setRevive(api, item);
      else if (type === 'MISC') await setMisc(api, item);
      else if (type === 'LOOTBOX') await setLootbox(api, item, droptablesCSV);
      else console.error('Item type not found: ' + type);
    } catch {}
  }
}

export async function deleteItems(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await sleepIf();
    try {
      await api.registry.item.delete(indices[i]);
    } catch {
      console.error('Could not delete item ' + indices[i]);
    }
  }
}

export async function setFood(api: AdminAPI, item: any) {
  await api.registry.item.create.food(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    Number(item['Health'] ?? 0),
    Number(item['XP'] ?? 0),
    item['MediaURI']
  );
}

export async function setRevive(api: AdminAPI, item: any) {
  await api.registry.item.create.revive(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    Number(item['Health'] ?? 0),
    item['MediaURI']
  );
}

export async function setMisc(api: AdminAPI, item: any) {
  await api.registry.item.create.consumable(
    Number(item['Index']),
    item['Name'],
    item['Description'],
    item['miscCategory'],
    item['MediaURI']
  );
}

export async function setLootbox(api: AdminAPI, item: any, droptables: any) {
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
