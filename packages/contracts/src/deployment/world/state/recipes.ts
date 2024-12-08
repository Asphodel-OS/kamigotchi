import { AdminAPI } from '../admin';
import { readFile, toCreate, toDelete, toRevise } from './utils';

export async function initRecipes(api: AdminAPI, overrideIndices?: number[]) {
  const recipesCSV = await readFile('crafting/recipes.csv');

  for (let i = 0; i < recipesCSV.length; i++) {
    const entry = recipesCSV[i];

    // skip if indices are overridden and recipe isn't included
    if (
      overrideIndices &&
      overrideIndices.length > 0 &&
      !overrideIndices.includes(Number(entry['Index']))
    )
      continue;

    if (!toCreate(entry)) continue;
    await createRecipe(api, entry);
  }
}

export async function deleteRecipes(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const recipesCSV = await readFile('crafting/recipes.csv');
    for (let i = 0; i < recipesCSV.length; i++) {
      if (toDelete(recipesCSV[i])) indices.push(Number(recipesCSV[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      await api.registry.recipe.delete(indices[i]);
    } catch {
      console.error('Could not delete recipe ' + indices[i]);
    }
  }
}

export async function reviseRecipes(api: AdminAPI, overrideIndices?: number[]) {
  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    const recipesCSV = await readFile('crafting/recipes.csv');
    for (let i = 0; i < recipesCSV.length; i++) {
      if (toRevise(recipesCSV[i])) indices.push(Number(recipesCSV[i]['Index']));
    }
  }
  await deleteRecipes(api, indices);
  await initRecipes(api, indices);
}

////////////////
// SUB-SHAPES

async function createRecipe(api: AdminAPI, entry: any) {
  const [iIndices, iAmts] = getInputArrays(entry);
  await api.registry.recipe.create(
    Number(entry['Index']),
    iIndices,
    iAmts,
    [Number(entry['Output Index'])],
    [Number(entry['Output Amount'])],
    Number(entry['Account XP Output']),
    Number(entry['Stamina Cost']) / 5 // TODO: change to base 100, not base20
  );

  // await addRequirement(api, entry);
}

async function addRequirement(api: AdminAPI, entry: any) {
  // only min level requirement
  const minLevel = Number(entry['Minimum Account Level'] ?? 1);
  if (minLevel > 1) {
    await api.registry.recipe.add.requirement(
      Number(entry['Index']),
      'LEVEL',
      'CURR_MIN',
      0,
      minLevel
    );
  }
}

/////////////////
// UTILS

function getInputArrays(entry: any): [number[], number[]] {
  const indices = [];
  const amounts = [];

  if (entry['Input 1 Index'] !== '') {
    indices.push(Number(entry['Input 1 Index']));
    amounts.push(Number(entry['Input 1 Amount']));
  }
  if (entry['Input 2 Index'] !== '') {
    indices.push(Number(entry['Input 2 Index']));
    amounts.push(Number(entry['Input 2 Amount']));
  }
  if (entry['Input 3 Index'] !== '') {
    indices.push(Number(entry['Input 3 Index']));
    amounts.push(Number(entry['Input 3 Amount']));
  }

  return [indices, amounts];
}
