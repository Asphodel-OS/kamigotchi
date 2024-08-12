import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryRelationsFrom, RelationQueryOptions } from './utils';

export const queryActions = (
  world: World,
  components: Components,
  fromID: EntityID,
  options?: RelationQueryOptions
): EntityIndex[] => {
  const { ToID } = components;
  const results: EntityIndex[] = [];

  const relations = queryRelationsFrom(components, fromID, options);
  for (let i = 0; i < relations.length; i++) {
    const actionID = getComponentValue(ToID, relations[i])?.value || '';
    const actionEntityIndex = world.entityToIndex.get(actionID as EntityID);
    if (actionEntityIndex) results.push(actionEntityIndex);
  }

  return results;
};
