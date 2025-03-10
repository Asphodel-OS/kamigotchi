import { AdminAPI } from '../api';
import { readFile } from './utils';

export async function initTraits(api: AdminAPI) {
  const backgroundCSV = await readFile('traits/backgrounds.csv');
  const bodyCSV = await readFile('traits/bodies.csv');
  const colorCSV = await readFile('traits/colors.csv');
  const faceCSV = await readFile('traits/faces.csv');
  const handCSV = await readFile('traits/hands.csv');

  await initTraitTable(api, backgroundCSV, 'BACKGROUND');
  await initTraitTable(api, bodyCSV, 'BODY');
  await initTraitTable(api, colorCSV, 'COLOR');
  await initTraitTable(api, faceCSV, 'FACE');
  await initTraitTable(api, handCSV, 'HAND');
}

// export async function deleteTraits(api: AdminAPI, indices: number[], types: string[]) {
//   for (let i = 0; i < indices.length; i++) {
//     try {
//       await api.registry.trait.delete(indices[i], types[i]);
//     } catch {
//       console.error('Could not delete trait ' + indices[i]);
//     }
//   }
// }

// inits a single type of trait, returns number of traits
async function initTraitTable(api: AdminAPI, table: any, type: string) {
  for (let i = 0; i < table.length; i++) {
    const trait = table[i];
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
