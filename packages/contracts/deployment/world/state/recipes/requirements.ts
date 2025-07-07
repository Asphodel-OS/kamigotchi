import { AdminAPI } from '../../api';

// adds a top-level tool requirement to a recipe
// NOTE: we should do this properly using a separate Requirements sheet instead
export async function addToolRequirement(api: AdminAPI, entry: any) {
  const addRequirement = api.registry.recipe.add.requirement;
  const index = Number(entry['Index']);

  const toolIndex = Number(entry['Tool Index'] ?? 0);
  if (toolIndex > 0) {
    console.log(`  adding tool requirement ${toolIndex}`);
    await addRequirement(index, 'ITEM', 'CURR_MIN', toolIndex, 1, '');
  }
}

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
