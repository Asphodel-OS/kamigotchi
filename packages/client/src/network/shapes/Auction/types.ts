import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import {
  getBalance,
  getDecay,
  getEntityType,
  getIndex,
  getItemIndex,
  getLimit,
  getResetTime,
  getScale,
  getStartTime,
  getValue,
} from '../utils/component';

// Auction represents a unidirectional Discrete GDA between two items
export interface Auction {
  id: EntityID;
  entity: EntityIndex;
  ObjectType: string;
  items: {
    outIndex: number; // item index of the item being auctioned
    inIndex: number; // item index of the item used as payment
  };
  params: {
    value: number; // initial target value of pricing curve
    decay: number; // decay constant of pricing curve
    scale: number; // scale factor of pricing curve
  };
  supply: {
    sold: number; // supply sold since last reset
    total: number; // supply remaining after last reset
  };
  time: {
    start: number;
    reset: number;
  };
}

// get an Auction from its EntityIndex
export const get = (world: World, components: Components, entity: EntityIndex): Auction => {
  return {
    id: world.entities[entity],
    entity,
    ObjectType: getEntityType(components, entity),
    items: {
      outIndex: getIndex(components, entity),
      inIndex: getItemIndex(components, entity),
    },
    supply: {
      sold: getBalance(components, entity),
      total: getLimit(components, entity),
    },
    params: {
      value: getValue(components, entity),
      decay: getDecay(components, entity, 9),
      scale: getScale(components, entity, 9),
    },
    time: {
      start: getStartTime(components, entity),
      reset: getResetTime(components, entity),
    },
  };
};
