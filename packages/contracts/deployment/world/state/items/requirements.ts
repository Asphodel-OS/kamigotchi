import { AdminAPI } from '../../api';
import { parseKamiStateToIndex } from '../utils';

/// @dev requirements depend on outdated item types (ie. FOOD, REVIVE, etc). to update
export async function addRequirement(api: AdminAPI, item: any) {
  // only adds requirement from type for now. slightly hardcoded for state requirements
  if (item['For'].toUpperCase() !== 'KAMI') return; // only kami need state requirements

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
  if (type === 'FOOD') return ['KAMI_CAN_EAT', 'BOOL_IS', 0, 0];
  else if (type === 'REVIVE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('DEAD'), 0];
  else if (type === 'CONSUMABLE') return ['STATE', 'BOOL_IS', parseKamiStateToIndex('RESTING'), 0];
  else throw new Error('Item type not found: ' + type);
}
