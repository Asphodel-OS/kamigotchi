import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { Droptable, getDroptable } from '../Droptable';
import { Stat, getStatFromUint } from '../Stats';

export interface Allo {
  id: EntityID;
  type: string;
  index: number;
  value: number;
  droptable?: Droptable;
  stat?: Stat;
}

// Get a Allo Registry object
export const getAllo = (world: World, components: Components, entity: EntityIndex): Allo => {
  const { Value, Index, Type } = components;

  const type = getComponentValue(Type, entity)?.value || ('' as string);
  const rawValue = getComponentValue(Value, entity)?.value || (0 as number);

  return {
    id: world.entities[entity],
    type: type,
    index: getComponentValue(Index, entity)?.value || (0 as number),
    value: rawValue * 1,
    droptable: type.includes('ITEM_DROPTABLE') ? getDroptable(components, entity) : undefined,
    stat: type === 'STAT' ? getStatFromUint(BigInt(rawValue)) : undefined,
  };
};
