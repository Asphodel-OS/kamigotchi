import { AdminAPI } from '../api';
import { getSheet, textToNumberArray } from './utils';

export async function initNpcs(api: AdminAPI) {
  await initMerchants(api);
}

export async function initMerchants(api: AdminAPI) {
  // create our hottie merchant ugajin. names are unique
  await api.npc.create(1, 'Mina', 13);
}

// NPC Droptables (for NPC sacrifices)
export const NPCDroptables = new Map<string, any>();

export const getNPCDroptablesMap = async () => {
  if (NPCDroptables.size > 0) return NPCDroptables;

  const csv = await getSheet('npc', 'droptables');
  for (let i = 0; i < csv.length; i++) {
    const row = csv[i];
    const key = row['Name'];
    if (!NPCDroptables.has(key)) NPCDroptables.set(key, row);
  }
  return NPCDroptables;
};

export async function initNPCDroptables(api: AdminAPI) {
  const map = await getNPCDroptablesMap();

  const normalEntry = map.get('Sacrifice Normal');
  const uncommonEntry = map.get('Sacrifice Uncommon Pity');
  const rareEntry = map.get('Sacrifice Rare Pity');

  if (!normalEntry || !uncommonEntry || !rareEntry) {
    console.error('Error: Missing NPC droptable entries');
    console.log('Found entries:', Array.from(map.keys()));
    return;
  }

  const normalKeys = textToNumberArray(normalEntry['Indices']);
  const normalWeights = textToNumberArray(normalEntry['Tiers']);
  const uncommonKeys = textToNumberArray(uncommonEntry['Indices']);
  const uncommonWeights = textToNumberArray(uncommonEntry['Tiers']);
  const rareKeys = textToNumberArray(rareEntry['Indices']);
  const rareWeights = textToNumberArray(rareEntry['Tiers']);

  console.log('Setting NPC sacrifice droptables:');
  console.log(`  Normal: ${normalKeys.length} items`);
  console.log(`  Uncommon Pity: ${uncommonKeys.length} items`);
  console.log(`  Rare Pity: ${rareKeys.length} items`);

  try {
    await api.sacrifice.droptable.setAll(
      normalKeys,
      normalWeights,
      uncommonKeys,
      uncommonWeights,
      rareKeys,
      rareWeights
    );
  } catch (e) {
    console.error('Could not set NPC sacrifice droptables', e);
  }
}
