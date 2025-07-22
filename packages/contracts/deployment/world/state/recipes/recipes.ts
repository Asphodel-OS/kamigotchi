import { AdminAPI } from '../../api';
import { getSheet, stringToNumberArray, toDelete, toRevise } from '../utils';
import { addToolRequirement } from './requirements';

// initialize a single recipe from a csv entry. this does not include requirements
export async function initRecipe(api: AdminAPI, entry: any) {
  const index = Number(entry['Index']);
  const type = entry['Type'];
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
      `Creating Recipe (${index}): for ${oAmt}x ${oIndex}`,
      `\n  with inputs ${iIndices.join(', ')} and amounts ${iAmts.join(', ')}`,
      `\n  costs ${staminaCost} stamina and outputs ${oXP} XP`
    );
    await api.registry.recipe.create(
      index,
      type,
      iIndices,
      iAmts,
      [oIndex],
      [oAmt],
      oXP,
      staminaCost
    );
  } catch (e) {
    console.error(`Error: Failed to create recipe ${index}`);
    console.error(e);
    success = false;
  }

  return success;
}

////////////////
// SCRIPTS

// initialize a specificified set of Recipes or those with a valid status (if unspecified)
export async function initRecipes(api: AdminAPI, indices?: number[], all?: boolean) {
  const csv = await getSheet('crafting', 'recipes');
  if (!csv) return console.log('No crafting/recipes.csv found');
  if (indices && indices.length == 0) return console.log('No recipes given to initialize');
  console.log('\n==INITIALIZING RECIPES==');

  // TODO: support test world status
  const validStatuses = ['To Deploy'];
  if (process.env.NODE_ENV !== 'production') validStatuses.push('Test');
  if (all || indices !== undefined) validStatuses.push('In Game', 'To Update');

  // process recipes
  for (let i = 0; i < csv.length; i++) {
    const entry = csv[i];
    const index = Number(entry['Index']);
    const status = entry['Status'];

    // if indices are overriden, skip if index isn't included
    // otherwise check for valid status
    if (indices && indices.length > 0) {
      if (!indices.includes(index)) continue;
    } else if (!validStatuses.includes(status)) continue;

    const success = await initRecipe(api, entry);
    if (!success) continue;
    await addToolRequirement(api, entry);
  }
}

// delete specified or sheet-marked recipes
export async function deleteRecipes(api: AdminAPI, overrideIndices?: number[]) {
  const csv = await getSheet('crafting', 'recipes');
  if (!csv) return console.log('No crafting/recipes.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < csv.length; i++) {
      if (toDelete(csv[i])) indices.push(Number(csv[i]['Index']));
    }
  }

  for (let i = 0; i < indices.length; i++) {
    try {
      console.log(`Deleting recipe ${indices[i]}`);
      await api.registry.recipe.delete(indices[i]);
    } catch {
      console.error('Could not delete recipe ' + indices[i]);
    }
  }
}

// revise specified or sheet-marked recipes
export async function reviseRecipes(api: AdminAPI, overrideIndices?: number[]) {
  const csv = await getSheet('crafting', 'recipes');
  if (!csv) return console.log('No crafting/recipes.csv found');

  let indices: number[] = [];
  if (overrideIndices) indices = overrideIndices;
  else {
    for (let i = 0; i < csv.length; i++) {
      if (toRevise(csv[i])) indices.push(Number(csv[i]['Index']));
    }
  }
  await deleteRecipes(api, indices);
  await initRecipes(api, indices);
}
