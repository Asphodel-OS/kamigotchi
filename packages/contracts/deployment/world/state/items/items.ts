import { AdminAPI } from '../../api';
import { getItemImage, getSheet, readFile } from '../utils';
import { addAllo } from './allos';
import { addRequirement } from './requirements';

const IGNORE_TYPES = ['OTHER'];
const BASIC_TYPES = ['MISC', 'MATERIAL', 'RING', 'KEY ITEM', 'NFT', 'TOOL', 'ERC20'];
const USE_TYPES = ['FOOD', 'LOOTBOX', 'REVIVE', 'CONSUMABLE'];

export async function initItems(api: AdminAPI, overrideIndices?: number[], deployAll?: boolean) {
  const itemsCSV = await getSheet('items', 'items');
  if (!itemsCSV) return console.log('No items/items.csv found');
  const allosCSV = await getSheet('items', 'allos');
  if (!allosCSV) return console.log('No items/allos.csv found');
  console.log('\n==INITIALIZING ITEMS==');

  // construct the map of allos for easier lookup
  const alloMap = new Map<string, any>();
  for (let i = 0; i < allosCSV.length; i++) {
    const row = allosCSV[i];
    const key = row['Name'].toUpperCase();
    if (!alloMap.has(key)) alloMap.set(key, row);
  }

  // iterate through rows of items
  for (let i = 0; i < itemsCSV.length; i++) {
    const row = itemsCSV[i];
    const index = Number(row['Index']);

    // if indices are overridden skip any not included, otherwise check status
    if (overrideIndices) {
      if (!overrideIndices.includes(index)) continue;
    } else if (deployAll) {
      const status = row['Status'];
      if (status !== 'Ready' && status !== 'Ingame') continue;
    } else {
      const status = row['Status'];
      if (status !== 'Ready') continue;
    }

    // attempt item creation
    try {
      await createItem(api, row);
    } catch {
      console.error('Could not create item', index);
      continue;
    }

    // process item effects
    const effectsRaw = row['Effects'];
    if (!effectsRaw) continue;

    const effects = effectsRaw.split(',');
    for (let i = 0; i < effects.length; i++) {
      const alloName = effects[i];
      const alloRow = alloMap.get(alloName);
      if (!alloRow) console.warn(`  Could not find allo ${alloName} for item ${index}`);
      else await addAllo(api, index, alloRow);
    }
  }
}

export async function deleteItems(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    try {
      console.log(`Deleting item ${indices[i]}`);
      await api.registry.item.delete(indices[i]);
    } catch {
      console.error('Could not delete item ' + indices[i]);
    }
  }
}

export async function reviseItems(api: AdminAPI, indices: number[]) {
  await deleteItems(api, indices);
  await initItems(api, indices);
}

export async function initLocalItems(api: AdminAPI) {
  const itemsCSV = await readFile('items/items.csv');

  for (let i = 0; i < itemsCSV.length; i++) {
    const row = itemsCSV[i];
    const type = String(row['Type']).toUpperCase();

    // skip if not ready
    const status = row['Status'];
    if (status !== 'Ready' && status !== 'Ingame') continue;

    // deploys and attaches local erc20
    if (type === 'ERC20') await api.setup.attachItemERC20(Number(row['Index']));
  }
}

////////////////
// SHAPES

async function createItem(api: AdminAPI, entry: any) {
  const type = String(entry['Type']).toUpperCase();
  if (IGNORE_TYPES.includes(type)) return;

  if (BASIC_TYPES.includes(type)) await createBasic(api, entry);
  else if (USE_TYPES.includes(type)) await createConsumable(api, entry);
  else console.error('Item type not found: ' + type);

  await addFlags(api, entry);
  if (type === 'ERC20') await addERC20(api, entry);
}

async function addFlags(api: AdminAPI, entry: any) {
  const flags = entry['Flags'].split(',').map((f: string) => f.trim());
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].length === 0) continue;
    await api.registry.item.add.flag(Number(entry['Index']), flags[i]);
  }
}

async function addERC20(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const address = entry['Address'];
  await api.registry.item.add.erc20(index, address);
}

////////////////
// SUB-SHAPES

// create a basic item
async function createBasic(api: AdminAPI, entry: any) {
  const createEP = api.registry.item.create;
  const index = Number(entry['Index']);
  const type = entry['Type'].toUpperCase();
  const name = entry['Name'].trim();
  const description = entry['Description'];
  const image = getItemImage(name);
  console.log(`creating ${type} item ${name} (${index})`);

  await createEP.base(index, type, name, description, image);
}

// create a consumable item
// TODO: set requirements more explicitly
async function createConsumable(api: AdminAPI, entry: any) {
  const createEP = api.registry.item.create;
  const index = Number(entry['Index']);
  const type = entry['Type'].toUpperCase();
  const name = entry['Name'].trim();
  const description = entry['Description'];
  const image = getItemImage(name);
  const for_ = (entry['For'] ?? 'KAMI').toUpperCase();
  console.log(`creating ${type} item ${name} (${index}) for ${for_}`);

  await createEP.consumable(index, for_, name, description, type, image);
  await addRequirement(api, entry); // hardcoded based on item types
}
