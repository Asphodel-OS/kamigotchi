import { AdminAPI } from '../../api';
import { getSheet, parseToInitCon } from '../utils';

export const Objectives = new Map<string, any>();

export const getObjectivesMap = async () => {
  if (Objectives.size > 0) return Objectives;

  const csv = await getSheet('quests', 'objectives');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Description'];
    if (!Objectives.has(key)) Objectives.set(key, row);
  }
  return Objectives;
};

// add a requirement to a quest
export const addObjective = async (api: AdminAPI, questIndex: number, entry: any) => {
  const key = entry['Description'];
  const operator = entry['Operator'];
  const deltaType = entry['DeltaType'];
  const type = entry['Type'];
  const index = Number(entry['Index'] ?? 0);
  const value = Number(entry['Value'] ?? 0);
  console.log(
    `  Adding Objective ${key} - (${operator}) (${deltaType}) (${type}) (${index}) (${value})`
  );

  try {
    const cond = parseToInitCon('', type, index, value);
    await api.registry.quest.add.objective(
      questIndex,
      key,
      deltaType + '_' + operator,
      cond.type,
      cond.index,
      cond.value,
      ''
    );
  } catch (e) {
    console.log(`Error: Failed to add Objective`);
    console.log(e);
  }
};
