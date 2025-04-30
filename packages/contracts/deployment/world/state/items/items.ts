import { AdminAPI } from '../../api';
import { getItemImage, getSheet, readFile } from '../utils';
import { addAllo } from './allos';
import { addRequirement, addTypeRequirement } from './requirements';

// TODO: update the set of state scripts in items/ to be modeled after quests/

const IGNORE_TYPES = ['OTHER'];
const BASIC_TYPES = ['MISC', 'MATERIAL', 'RING', 'KEY ITEM', 'NFT', 'TOOL', 'ERC20'];
const USE_TYPES = ['FOOD', 'LOOTBOX', 'REVIVE', 'CONSUMABLE'];

export async function initItems(api: AdminAPI, indices?: number[], all?: boolean) {
  const itemsCSV = await getSheet('items', 'items');
  if (!itemsCSV) return console.log('No items/items.csv found');
  const allosCSV = await getSheet('items', 'allos');
  if (!allosCSV) return console.log('No items/allos.csv found');
  const requirementsCSV = await getSheet('items', 'requirements');
  if (!requirementsCSV) return console.log('No items/requirements.csv found');
  console.log('\n==INITIALIZING ITEMS==');

  const validStatuses = ['To Deploy'];
  if (all || indices !== undefined) validStatuses.push('Ready', 'In Game');

  // construct the map of allos for easier lookup
  const alloMap = new Map<string, any>();
  for (let i = 0; i < allosCSV.length; i++) {
    const row = allosCSV[i];
    const key = row['Name'].toUpperCase();
    if (!alloMap.has(key)) alloMap.set(key, row);
  }
  const requirementMap = new Map<string, any>();
  for (let i = 0; i < requirementsCSV.length; i++) {
    const row = requirementsCSV[i];
    const key = row['Name'].toUpperCase();
    if (!requirementMap.has(key)) requirementMap.set(key, row);
  }

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

    // process item requirements
    const requirementsRaw = row['Requirements'];
    if (!requirementsRaw) continue;

    const requirements = requirementsRaw.split(',');
    for (let i = 0; i < requirements.length; i++) {
      const requirementName = requirements[i];
      const requirementRow = requirementMap.get(requirementName);
      if (!requirementRow)
        console.warn(`  Could not find requirement ${requirementName} for item ${index}`);
      else await addRequirement(api, index, requirementRow);
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

// TODO: move this to sheet based local deploys
export async function initLocalItems(api: AdminAPI) {
  const itemsCSV = await readFile('items/items.csv');

  for (let i = 0; i < itemsCSV.length; i++) {
    const row = itemsCSV[i];
    const type = String(row['Type']).toUpperCase();

    // skip if not ready
    const status = row['Status'];
    if (status !== 'Ready' && status !== 'Ingame') continue;

    // deploys and attaches local erc20
    if (type === 'ERC20') await api.setup.local.attachItemERC20(Number(row['Index']));
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
  const rawAddr = entry['Address'];
  const address = rawAddr.length > 0 ? rawAddr : '0x0000000000000000000000000000000000000000';
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
  await addTypeRequirement(api, entry); // hardcoded based on item types
}
