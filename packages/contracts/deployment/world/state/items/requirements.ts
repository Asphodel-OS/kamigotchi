import { AdminAPI } from '../../api';
import { getSheet, parseKamiStateToIndex, parseToInitCon } from '../utils';

export const Requirements = new Map<string, any>();

// retrieve the singleton Map of all Requirements
// if it hasn't been instantiated, populate it with the item requirements sheet
export const getRequirementsMap = async () => {
  if (Requirements.size > 0) return Requirements;

  const csv = await getSheet('items', 'requirements');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Name'];
    if (!Requirements.has(key)) Requirements.set(key, row);
  }
  return Requirements;
};

// find and add all the requirements of a item
export const addRequirements = async (api: AdminAPI, itemRow: any) => {
  const index = Number(itemRow['Index']);

  const map = await getRequirementsMap();
  const keys = itemRow['Requirements'].split(',');
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) continue;

    const req = map.get(key);
    if (req) await addRequirement(api, index, req);
    else console.log(`Error: Could not find Requirement ${key} for item ${index}`);
  }
};

// add a single requirement to an item
export async function addRequirement(api: AdminAPI, itemIndex: number, entry: any) {
  const type = entry['Type'];
  const index = Number(entry['Index'] ?? 0);
  const value = Number(entry['Value'] ?? 0);
  const preposition = entry['Preposition'];
  const cond = parseToInitCon(preposition, type, index, value);

  console.log(`  Adding Requirement (${type}) (${cond.logicType}) (${index}) (${value})`);
  await api.registry.item.add.requirement(
    itemIndex,
    'USE',
    cond.type,
    cond.logicType,
    cond.index,
    cond.value,
    ''
  );
}

/// @dev requirements depend on outdated item types (ie. FOOD, REVIVE, etc). to update
export async function addTypeRequirement(api: AdminAPI, item: any) {
  // only adds requirement from type for now. slightly hardcoded for state requirements
  if (item['For'].toUpperCase() !== 'KAMI') return; // only kami need state requirements

  const itemType = item['Type'].toUpperCase();
  const [type, logicType, index, value] = itemTypeToRequirement(itemType);
  await api.registry.item.add.requirement(
    Number(item['Index']),
    'USE',
    type,
    logicType,
    index,
    value,
    ''
  );
}

// determine the structure of an item's requirement based on its type
export function itemTypeToRequirement(type: string): [string, string, number, number] {
  if (type === 'FOOD') return ['KAMI_CAN_EAT', 'BOOL_IS', 0, 0];
  else if (type === 'REVIVE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('DEAD'), 0];
  else if (type === 'CONSUMABLE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('RESTING'), 0];
  else throw new Error('Item type not found: ' + type);
}
