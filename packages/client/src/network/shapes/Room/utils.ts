import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';

export interface Coord {
  x: number;
  y: number;
  z: number;
}

export const getLocation = (components: Components, index: EntityIndex): Coord => {
  const { Location } = components;
  return bigIntToCoord(BigInt(getComponentValue(Location, index)?.value || 0));
};

export const getAdjacentLocations = (location: Coord): Coord[] => {
  const { x, y, z } = location;
  return [
    { x: x + 1, y, z },
    { x: x - 1, y, z },
    { x, y: y + 1, z },
    { x, y: y - 1, z },
  ];
};

export const coordToBigInt = (value: Coord): bigint => {
  return (BigInt(value.x) << 128n) | (BigInt(value.y) << 64n) | BigInt(value.z);
};

// NOTE/TODO?: this conversion should probably live at the network level
export const bigIntToCoord = (value: bigint): Coord => {
  return {
    x: Number(value >> 128n),
    y: Number((value >> 64n) & 0xffffffffffffffffn),
    z: Number(value & 0xffffffffffffffffn),
  };
};
