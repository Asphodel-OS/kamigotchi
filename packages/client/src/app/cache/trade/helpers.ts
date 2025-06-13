import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { TradeOrder } from 'network/shapes/Trade/types';
import { getKeys, getValues } from 'network/shapes/utils/component';
import { getItemByIndex } from '../item';

export const getOrder = (
  world: World,
  comps: Components,
  entity: EntityIndex | undefined
): TradeOrder => {
  if (!entity) return { items: [], amounts: [] };

  const keys = getKeys(comps, entity);
  const values = getValues(comps, entity);

  return {
    items: keys.map((key) => getItemByIndex(world, comps, key)),
    amounts: values,
  };
};
