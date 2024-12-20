import { EntityIndex, Has, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { getIndex } from '../utils/component';

// get all recipes
export const queryForAllRecipes = (components: Components): EntityIndex[] => {
  const { RecipeIndex, IsRegistry } = components;
  return Array.from(runQuery([Has(RecipeIndex), Has(IsRegistry)]));
};

// generalised query
export type QueryOptions = {
  npcEntityIndex?: EntityIndex;
  nodeEntityIndex?: EntityIndex;
};

export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { RecipeIndex, NodeIndex, NPCIndex, EntityType } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.npcEntityIndex != undefined)
    toQuery.push(
      HasValue(NPCIndex, { value: getIndex(components, options.npcEntityIndex) }),
      Has(RecipeIndex)
    );
  if (options?.nodeEntityIndex != undefined)
    toQuery.push(
      HasValue(NodeIndex, { value: getIndex(components, options.nodeEntityIndex) }),
      Has(RecipeIndex)
    );
  toQuery.push(HasValue(EntityType, { value: 'RECIPE' }));
  const results = runQuery(toQuery);
  return Array.from(results);
};
