import { AdminAPI } from '../../api';
import { parseKamiStateToIndex, parseToInitCon } from '../utils';

export async function addRequirement(api: AdminAPI, itemIndex: number, entry: any) {
  const type = entry['Type'];
  const index = Number(entry['Index'] ?? 0);
  const value = Number(entry['Value'] ?? 0);
  const cond = parseToInitCon(entry['Preposition'], type, index, value);

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

export /// @dev requirements depend on outdated item types (ie. FOOD, REVIVE, etc). to update
async function addTypeRequirement(api: AdminAPI, item: any) {
  // only adds requirement from type for now. slightly hardcoded for state requirements
  if (!item['For'].toUpperCase().includes('KAMI')) return; // only kami need state requirements

  const [type, logicType, index, value] = itemTypeToRequirement(item['Type'].toUpperCase());
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

export function itemTypeToRequirement(type: string): [string, string, number, number] {
  if (type === 'FOOD' || type === 'POTION') return ['KAMI_CAN_EAT', 'BOOL_IS', 0, 0];
  else if (type === 'REVIVE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('DEAD'), 0];
  else if (type === 'CONSUMABLE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('RESTING'), 0];
  else throw new Error('Item type not found: ' + type);
}
