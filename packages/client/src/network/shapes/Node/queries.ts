import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { hashArgs } from '../utils';

// node index -> id cache
const IDStore = new Map<number, EntityID>();

// get the entity ID of a Node by its index
export const indexToID = (index: number): EntityID => {
  return hashArgs(['node', index], ['string', 'uint32']);
};

// query for the entity index of the Node with the given index
export const queryByIndex = (world: World, index: number): EntityIndex | undefined => {
  const id = indexToID(index);
  return world.entityToIndex.get(id);
};

// query for the kami entities with active harvests on a given node (by node index)
export const queryForKamis = (world: World, comps: Components, index: number): EntityIndex[] => {
  const { EntityType, SourceID, HolderID, State } = comps;
  const id = indexToID(index);

  // get list of active harvests on this node
  const harvestEntities = Array.from(
    runQuery([
      HasValue(SourceID, { value: id }), // most constraining field first
      HasValue(State, { value: 'ACTIVE' }),
      HasValue(EntityType, { value: 'HARVEST' }),
    ])
  );

  // get the kami entity for each harvest by the holderID
  const kamiEntities = harvestEntities.map((entity) => {
    const kamiRes = getComponentValue(HolderID, entity);
    if (!kamiRes) console.warn('No holder ID for harvest', index);
    const kamiID = formatEntityID(kamiRes?.value ?? '');
    return world.entityToIndex.get(kamiID);
  });
  return kamiEntities.filter((entity) => entity !== undefined);
};
