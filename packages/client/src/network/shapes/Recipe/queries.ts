import { EntityIndex, Has, HasValue, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { getIndex } from '../utils/component';

// recipes given by npc
export const queryForRecipebyNpc = (components: Components, entity: EntityIndex): EntityIndex[] => {
  if (!entity) return [];
  const { RecipeIndex, NPCIndex } = components;
  return Array.from(
    runQuery([HasValue(NPCIndex, { value: getIndex(components, entity) }), Has(RecipeIndex)])
  );
};

// recipes given by node
export const queryForRecipebyNode = (
  components: Components,
  entity: EntityIndex
): EntityIndex[] => {
  if (!entity) return [];
  const { RecipeIndex, NodeIndex } = components;
  return Array.from(
    runQuery([HasValue(NodeIndex, { value: getIndex(components, entity) }), Has(RecipeIndex)])
  );
};
