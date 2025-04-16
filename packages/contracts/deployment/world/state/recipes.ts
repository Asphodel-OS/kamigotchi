import { AdminAPI } from '../api';
import { getSheet, readFile, stringToNumberArray, toDelete, toRevise } from './utils';

////////////////
// SCRIPTS

export async function initRecipes(api: AdminAPI, indices?: number[], all?: boolean) {
  const recipesCSV = await getSheet('crafting', 'recipes');
  if (!recipesCSV) return console.log('No crafting/recipes.csv found');
  console.log('\n==INITIALIZING RECIPES==');

  // TODO: support test world status
  const validStatuses = ['To Deploy'];
  if (all || indices !== undefined) {
    validStatuses.push('Ready');
    validStatuses.push('In Game');
  }

  for (let i = 0; i < recipesCSV.length; i++) {
    const entry = recipesCSV[i];
    const index = Number(entry['Index']);
    const status = entry['Status'];

    // if indices are overriden, skip if index isn't included
    // otherwise check for valid status
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

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
  const index = Number(entry['Index']);
  const iIndices = stringToNumberArray(entry['Input Indices']);
  const iAmts = stringToNumberArray(entry['Input Amounts']);
  const oIndex = Number(entry['Output Index']);
  const oAmt = Number(entry['Output Amount']);
  const oXP = Number(entry['XP Output']);
  const staminaCost = Number(entry['Cost (Stamina)']);

  // not yet supporting multiple outputs
  let success = true;
  try {
    console.log(
      `Creating Recipe: (${index}) for ${oAmt}x ${oIndex}`,
      `\n  with inputs ${iIndices.join(', ')} and amounts ${iAmts.join(', ')}`,
      `\n  costs ${staminaCost} stamina and outputs ${oXP} XP`
    );
    await api.registry.recipe.create(index, iIndices, iAmts, [oIndex], [oAmt], oXP, staminaCost);
  } catch (e) {
    success = false;
    console.error(`Could not create recipe ${index}`, e);
  } finally {
    if (success) await addRequirement(api, entry);
  }
}

async function addRequirement(api: AdminAPI, entry: any) {
  const addRequirement = api.registry.recipe.add.requirement;
  const index = Number(entry['Index']);

  // level requirement
  // SKIPPED level requirement until account levels are in
  // const minLevel = Number(entry['Minimum Account Level'] ?? 1);
  // if (minLevel > 1) {
  //   await api.registry.recipe.add.requirement(
  //     Number(entry['Index']),
  //     'LEVEL',
  //     'CURR_MIN',
  //     0,
  //     minLevel
  //   );
  // }

  // tool requirement
  const toolIndex = Number(entry['Tool Index'] ?? 0);
  if (toolIndex > 0) {
    console.log(`  adding tool requirement ${toolIndex}`);
    await addRequirement(index, 'ITEM', 'CURR_MIN', toolIndex, 1, '');
  }
}
