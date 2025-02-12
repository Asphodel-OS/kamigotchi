import { World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { NullAuction } from './constants';
import { query } from './queries';
import { Auction, get, Options } from './types';

// get all auctions
export const getAll = (world: World, components: Components, options?: Options): Auction[] => {
  const results = query(components);
  return results.map((entity) => get(world, components, entity, options));
};

// get an auction by the item index of the item it's auctioning
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Auction => {
  const results = query(components, { outputItem: index });
  if (!results || results.length == 0) return NullAuction;
  if (results.length > 1) console.warn(`found more than one auction with index ${index}`);
  return get(world, components, results[0], options);
};
