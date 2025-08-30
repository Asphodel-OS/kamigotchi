import { AdminAPI } from '../../api';
import { getItemImage, getSheet, readFile, toRevise } from '../utils';
import { addAllos } from './allos';
import { addRequirements, addTypeRequirement } from './requirements';

const IGNORE_TYPES = ['OTHER', 'ERC20'];
const BASIC_TYPES = ['MISC', 'MATERIAL', 'RING', 'KEY ITEM', 'NFT', 'TOOL'];
const USE_TYPES = ['FOOD', 'LOOTBOX', 'REVIVE', 'CONSUMABLE'];

// initialize a single item
async function init(api: AdminAPI, entry: any) {
  const type = String(entry['Type']).toUpperCase();
  if (IGNORE_TYPES.includes(type)) {
    console.log(`Ignoring item ${entry['Index']} of type ${type}`);
    return;
  }

  if (BASIC_TYPES.includes(type)) await createBasic(api, entry);
  else if (USE_TYPES.includes(type)) await createConsumable(api, entry);
  else console.error('Item type not found: ' + type);
}

////////////////
// SCRIPTS

// initialize a specificified set of Items or those with a valid status (if unspecified)
export async function initItems(api: AdminAPI, indices?: number[], all?: boolean) {
  const itemsCSV = await getSheet('items', 'items');
  if (!itemsCSV) return console.log('No items/items.csv found');
  if (indices && indices.length == 0) return console.log('No items given to initialize');
  console.log('\n==INITIALIZING ITEMS==');

  // set valid statuses, based on implicit/explicit indices override
  const validStatuses = ['To Deploy'];
  if (all || indices !== undefined) validStatuses.push('Ready', 'In Game', 'To Update');

  // iterate through rows of items
  for (let i = 0; i < itemsCSV.length; i++) {
    const row = itemsCSV[i];
    const index = Number(row['Index']);
    const status = row['Status'];

    // if indices are overridden skip any not included, otherwise check status
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

    // attempt item creation
    try {
      await init(api, row);
    } catch {
      console.error('Could not create item', index);
      continue;
    }

    // process item effects and requirements
    await addFlags(api, row);
    await addAllos(api, row);
    await addRequirements(api, row);
  }
}

// delete specified items
// TODO: consider supporting sheet data-based deletion marking
export async function deleteItems(api: AdminAPI, indices: number[]) {
  console.log('\n==DELETING ITEMS==');
  for (let i = 0; i < indices.length; i++) {
    try {
      console.log(`Deleting item ${indices[i]}`);
      await api.registry.item.delete(indices[i]);
    } catch {
      console.error('Could not delete item ' + indices[i]);
    }
  }
}

// revise specified items
export async function reviseItems(api: AdminAPI, overrideIndices?: number[]) {
  const itemsCSV = await getSheet('items', 'items');
  if (!itemsCSV) return console.log('No items/items.csv found');

  let indices: number[] = [];
  if (overrideIndices && overrideIndices.length > 0) indices = overrideIndices;
  else {
    for (let i = 0; i < itemsCSV.length; i++) {
      const row = itemsCSV[i];
      const index = Number(row['Index']);
      if (toRevise(row)) indices.push(index);
    }
  }

  await deleteItems(api, indices);
  await initItems(api, indices);
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
  await addTypeRequirement(api, entry); // implicit requirement derived from item types
}

////////////////
// UTILS

async function addFlags(api: AdminAPI, entry: any) {
  const flags = entry['Flags'].split(',').map((f: string) => f.trim());
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].length === 0) continue;
    await api.registry.item.add.flag(Number(entry['Index']), flags[i]);
  }
}

// TODO: move this to sheet based local deploys
export async function initLocalItems(api: AdminAPI) {
  const itemsCSV = await readFile('items/items.csv');

  for (let i = 0; i < itemsCSV.length; i++) {
    const row = itemsCSV[i];
    const type = String(row['Type']).toUpperCase();

    // skip if not ready
    const status = row['Status'];
    if (status !== 'Ready' && status !== 'In Game') continue;

    // deploys and attaches local erc20
    if (type === 'ERC20') await api.setup.local.attachItemERC20(Number(row['Index']));
  }
}
