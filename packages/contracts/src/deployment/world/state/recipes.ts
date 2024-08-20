import { AdminAPI } from '../admin';
import { getRegID } from './utils';

export async function initRecipes(api: AdminAPI) {
  await api.registry.recipe.create(
    1,
    [101, 102, 103], // input indices
    [50, 180, 320], // input amounts
    [110], // output indices
    [1], // output amounts
    50, // xp
    1 // stamina cost
  );
  await api.registry.recipe.add.assigner(1, getRegID(1, 'NPC'));

  await api.registry.recipe.create(
    2,
    [107, 108, 109], // input indices
    [160, 90, 50], // input amounts
    [11002], // output indices
    [2], // output amounts
    160, // xp
    4 // stamina cost
  );
  await api.registry.recipe.add.assigner(2, getRegID(1, 'NPC'));

  await api.registry.recipe.create(
    3,
    [110, 111, 112], // input indices
    [100, 50, 100], // input amounts
    [11003], // output indices
    [3], // output amounts
    100, // xp
    2 // stamina cost
  );

  await api.registry.recipe.create(
    4,
    [110, 111, 112], // input indices
    [100, 50, 100], // input amounts
    [11004, 11005], // output indices
    [4, 1], // output amounts
    100, // xp
    2 // stamina cost
  );
  await api.registry.recipe.add.assigner(4, getRegID(1, 'NPC'));
}
