import { EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Coord, coordToBigInt } from './utils';

export type QueryOptions = {
  index?: number;
  location?: Coord;
};

// returns raw entity index
export const query = (components: Components, options: QueryOptions): EntityIndex[] => {
  const { Location, EntityType, RoomIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.index) toQuery.push(HasValue(RoomIndex, { value: options.index }));
  if (options?.location) {
    toQuery.push(
      HasValue(Location, {
        value: '0x' + ('0' + coordToBigInt(options.location).toString(16)).slice(-48),
      })
    );
  }
  toQuery.push(HasValue(EntityType, { value: 'ROOM' }));

  return Array.from(runQuery(toQuery));
};
