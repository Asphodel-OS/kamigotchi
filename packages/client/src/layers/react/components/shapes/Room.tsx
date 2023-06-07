import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';

// standardized Object shape of a Room Entity
export interface Room {
  id: EntityID;
  entityIndex: EntityIndex;
  name: string;
  location: number;
  exits: number[];
}

// get a Room object from its EnityIndex
export const getRoom = (layers: Layers, index: EntityIndex): Room => {
  const {
    network: {
      components: {
        Name,
        Location,
        Exits,
      },
      world,
    },
  } = layers;

  return {
    id: world.entities[index],
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    location: getComponentValue(Location, index)?.value as number * 1,
    exits: getComponentValue(Exits, index)?.value as number[],
  };
}