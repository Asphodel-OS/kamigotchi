import { EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Coord, coordToBigInt } from './utils';

const IndexCache = new Map<number, EntityIndex>();

export type QueryOptions = {
  index?: number;
  location?: Coord;
};

// returns raw entity index
export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
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

// Index query relying on query() with cached results
export const queryByIndex = (components: Components, index: number): EntityIndex | undefined => {
  if (IndexCache.has(index)) return IndexCache.get(index)!;
  const results = query(components, { index });
  if (results.length > 1) console.warn('More than one room found for index', index);
  else if (results.length == 0) console.warn('No room found for index', index);
  else IndexCache.set(index, results[0]);

  return results[0];
};
