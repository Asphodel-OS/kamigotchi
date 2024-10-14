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
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
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
// UTILS

const IDStore = new Map<string, string>();

export const genID = (fromID: string, toID: string): EntityID => {
  const key = 'assigner' + fromID + toID;

  if (!IDStore.has(key)) {
    IDStore.set(
      key,
      formatEntityID(utils.solidityKeccak256(['string', 'uint256', 'uint256'], [fromID, toID]))
    );
  }

  return IDStore.get(key)! as EntityID;
};
