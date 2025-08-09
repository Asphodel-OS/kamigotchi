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
  sourceId: string;
  stat?: Stat;
}

// Get a Allo Registry object
export const getAllo = (world: World, components: Components, entity: EntityIndex): Allo => {
  const { Value, Index, Type, SourceID } = components;

  const type = getComponentValue(Type, entity)?.value || '';
  const rawValue = getComponentValue(Value, entity)?.value || 0;
  const sourceId = getComponentValue(SourceID, entity)?.value || '';

  return {
    id: world.entities[entity],
    type,
    index: getComponentValue(Index, entity)?.value || 0,
    value: rawValue,
    sourceId,
    droptable: type.includes('ITEM_DROPTABLE') ? getDroptable(components, entity) : undefined,
    stat: type === 'STAT' ? getStatFromUint(BigInt(rawValue)) : undefined,
  };
};
