import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
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
      components: { Name, Location, Exits },
      world,
    },
  } = layers;

  return {
    id: world.entities[index],
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    location: (getComponentValue(Location, index)?.value as number) * 1,
    exits: getComponentValue(Exits, index)?.value as number[],
  };
};

export const getRoomEntityIndexByLocation = (layers: Layers, location: number): EntityIndex => {
  const {
    network: {
      components: {
        IsRoom,
        Location
      },
    },
  } = layers;

  let hexLocation = location.toString(16);
  if (hexLocation.length % 2) hexLocation = '0' + hexLocation;
  hexLocation = '0x' + hexLocation;

  const roomEntityIndex = Array.from(
    runQuery([Has(IsRoom), HasValue(Location, { value: hexLocation })])
  )[0];

  return roomEntityIndex;
}
