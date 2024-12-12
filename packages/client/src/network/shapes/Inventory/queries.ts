import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  runQuery,
  World,
} from '@mud-classic/recs';

import { Components } from 'network/components';
import { getEntityByHash } from '../utils';

interface QueryOptions {
  owner?: EntityID;
  itemIndex?: number;
  registry?: boolean;
}

export const query = (components: Components, options: QueryOptions) => {
  const { EntityType, OwnsInvID, IsRegistry, ItemIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.owner) toQuery.push(HasValue(OwnsInvID, { value: options.owner }));
  if (options?.itemIndex) toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  if (options?.registry !== undefined) {
    if (options?.registry) toQuery.push(Has(IsRegistry));
    else toQuery.push(Not(IsRegistry));
  }
  toQuery.push(HasValue(EntityType, { value: 'INVENTORY' }));

  return Array.from(runQuery(toQuery));
};

// retrieve an Inventory entity by its deterministic combo (holderID, itemIndex)
export const queryInstance = (
  world: World,
  holderID: EntityID,
  itemIndex: number
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['inventory.instance', holderID, itemIndex],
    ['string', 'uint256', 'uint32']
  );
};
