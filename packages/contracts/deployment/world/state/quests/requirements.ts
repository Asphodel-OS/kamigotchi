import { AdminAPI } from '../../api';
import { getSheet, parseToInitCon } from '../utils';

export const Requirements = new Map<string, any>();

// get or generate the singleton Map of all Requirements
export const getRequirementsMap = async () => {
  if (Requirements.size > 0) return Requirements;

  const csv = await getSheet('quests', 'requirements');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Description'];
    if (!Requirements.has(key)) Requirements.set(key, row);
  }
  return Requirements;
};

// find and add all the requirements of a quest
export const addRequirements = async (api: AdminAPI, questRow: any) => {
  const index = Number(questRow['Index']);

  const map = await getRequirementsMap();
  const keys = questRow['Requirements'].split(',');
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) continue;

    const req = map.get(key);
    if (req) await addRequirement(api, index, req);
    else console.log(`Error: Could not find Requirement ${key}`);
  }
};

// add a requirement to a quest
export const addRequirement = async (api: AdminAPI, questIndex: number, entry: any) => {
  const key = entry['Description'];
  const operator = entry['Operator'];
  const type = entry['Type'];
  const index = Number(entry['Index'] ?? 0);
  const value = Number(entry['Value'] ?? 0);
  console.log(`  Adding Requirement ${key} - (${operator}) (${type}) (${index}) (${value})`);

  try {
    const cond = parseToInitCon(operator, type, index, value);
    await api.registry.quest.add.requirement(
      questIndex,
      cond.logicType,
      cond.type,
      cond.index,
      cond.value,
      ''
    );
  } catch (e) {
    console.log(`Error: Failed to add Requirement`);
    console.log(e);
  }
};
