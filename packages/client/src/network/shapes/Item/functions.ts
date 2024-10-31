import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/index';
import { queryInventoryInstance } from '../Inventory';

/////////////////
// GETTERS
// TODO: move these to.. app/cache/inventory/helpers.ts?

// get the MUSU balance of a holder entity
export const getMusuBalance = (
  world: World,
  components: Components,
  entity: EntityIndex
): number => {
  const id = world.entities[entity];
  return getItemBalance(world, components, id, MUSU_INDEX);
};

// TODO: make this an Inventory function
export const getItemBalance = (
  world: World,
  components: Components,
  holderID: EntityID,
  itemIndex: number
): number => {
  const { Value } = components;
  const entityIndex = queryInventoryInstance(world, holderID ?? 0, itemIndex);
  return entityIndex ? (getComponentValue(Value, entityIndex)?.value ?? 0) * 1 : 0;
};
