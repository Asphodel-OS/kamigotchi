import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  runQuery,
} from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';

export interface QueryOptions {
  item: boolean;
  recipe: boolean;
  quest: boolean;
}

export const queryRelationsFrom = (
  components: Components,
  fromID: EntityID,
  options?: QueryOptions
): EntityIndex[] => {
  const { FromID, ItemIndex, QuestIndex } = components;

  const toQuery: QueryFragment[] = [HasValue(FromID, { value: fromID })];
  if (options?.item) toQuery.push(Has(ItemIndex));
  // if (options?.recipe) toQuery.push(Has(RecipeIndex));
  if (options?.quest) toQuery.push(Has(QuestIndex));

  return Array.from(runQuery(toQuery));
};

export const getRelationEntityIndex = (
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

export const genID = (entity1: string, entity2: string): EntityID => {
  const key = entity1 + entity2;

  if (!IDStore.has(key)) {
    IDStore.set(
      key,
      formatEntityID(utils.solidityKeccak256(['string', 'uint32'], [entity1, entity2]))
    );
  }

  return IDStore.get(key)! as EntityID;
};
