import backgroundCSV from 'assets/data/traits/backgrounds.csv';
import bodyCSV from 'assets/data/traits/bodies.csv';
import colorCSV from 'assets/data/traits/colors.csv';
import faceCSV from 'assets/data/traits/faces.csv';
import handCSV from 'assets/data/traits/hands.csv';
import { AdminAPI } from '../admin';
import { sleepIf } from './utils';

export async function initTraits(api: AdminAPI) {
  await initTraitTable(api, backgroundCSV, 'BACKGROUND');
  await initTraitTable(api, bodyCSV, 'BODY');
  await initTraitTable(api, colorCSV, 'COLOR');
  await initTraitTable(api, faceCSV, 'FACE');
  await initTraitTable(api, handCSV, 'HAND');
}

// inits a single type of trait, returns number of traits
export async function initTraitTable(api: AdminAPI, table: any, type: string) {
  for (let i = 0; i < table.length; i++) {
    const trait = table[i];
    await sleepIf();
    try {
      api.registry.trait.create(
        Number(trait['Index']), // individual trait index
        Number(trait['Health'] ?? 0),
        Number(trait['Power'] ?? 0),
        Number(trait['Violence'] ?? 0),
        Number(trait['Harmony'] ?? 0),
        Number(trait['Slots'] ?? 0),
        Number(trait['Tier'] ?? 0),
        (trait['Affinity'] ?? '').toUpperCase(),
        trait['Name'], // name of trait
        type // type: body, color, etc
      );
    } catch (e) {
      console.error('Failed to create trait ', trait, e);
    }
  }
  return table.length;
}

export async function deleteTraits(api: AdminAPI, indices: number[], types: string[]) {
  for (let i = 0; i < indices.length; i++) {
    await sleepIf();
    try {
      await api.registry.trait.delete(indices[i], types[i]);
    } catch {
      console.error('Could not delete trait ' + indices[i]);
    }
  }
}
