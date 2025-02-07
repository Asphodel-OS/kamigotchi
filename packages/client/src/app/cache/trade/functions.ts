import { EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { TradeOrder } from 'network/shapes/Trade/types';
import { getItemByIndex } from '../item';

export const getOrderCache = (
  world: World,
  components: Components,
  entity: EntityIndex | undefined
): TradeOrder => {
  if (!entity) return { items: [], amounts: [] };

  const { Keys, Values } = components;
  const keys = getComponentValue(Keys, entity)?.value as number[];
  const values = getComponentValue(Values, entity)?.value as number[];

  return {
    items: keys.map((key) => getItemByIndex(world, components, key)),
    amounts: values,
  };
};
