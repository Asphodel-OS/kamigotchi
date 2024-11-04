import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { Components } from 'network/';
import { hashArgs } from './utils';
export interface QueryOptions {
  item?: boolean;
  recipe?: boolean;
  quest?: boolean;
}

export const queryActions = (
  world: World,
  components: Components,
  fromID: EntityID,
  options?: QueryOptions
): EntityIndex[] => {
  const { ToID } = components;
  const results: EntityIndex[] = [];

  const relations = queryAssignersFrom(components, fromID, options);
  for (let i = 0; i < relations.length; i++) {
    const actionID = getComponentValue(ToID, relations[i])?.value || '';
    const actionEntityIndex = world.entityToIndex.get(actionID as EntityID);
    if (actionEntityIndex) results.push(actionEntityIndex);
  }

  return results;
};

export const queryAssignersFrom = (
  components: Components,
  fromID: EntityID,
  options?: QueryOptions
): EntityIndex[] => {
  const { FromID, ItemIndex, QuestIndex, RecipeIndex } = components;

  const toQuery: QueryFragment[] = [HasValue(FromID, { value: fromID })];
  if (options?.item) toQuery.push(Has(ItemIndex));
  if (options?.recipe) toQuery.push(Has(RecipeIndex));
  if (options?.quest) toQuery.push(Has(QuestIndex));

  return Array.from(runQuery(toQuery));
};

export const getAssignerEntity = (
  world: World,
  fromID: EntityID,
  toID: EntityID
): EntityIndex | undefined => {
  const id = genID(fromID, toID);
  return world.entityToIndex.get(id);
};

/////////////////
// IDs

export const genID = (fromID: string, toID: string): EntityID => {
  return hashArgs(['assigner', fromID, toID], ['string', 'uint256', 'uint256']);
};
