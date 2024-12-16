import { EntityIndex, HasValue, QueryFragment, runQuery, World } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'network/';
import { getKamiOwnerID } from '../utils/component';

export type QueryOptions = {
  index?: number;
  name?: string;
  operator?: string;
  owner?: string;
  room?: number;
};

// account entity querying caches on (relatively) static fields
export const IndexCache = new Map<number, EntityIndex>(); // account index to entity index
export const NameCache = new Map<string, EntityIndex>(); // account name to entity index
export const OperatorCache = new Map<string, EntityIndex>(); // account operator to entity index
export const OwnerCache = new Map<string, EntityIndex>(); // account owner to entity index

// query Account entities generally with query options. return matching entity indices
const query = (comps: Components, options?: QueryOptions): EntityIndex[] => {
  const { AccountIndex, EntityType, Name, OwnerAddress, OperatorAddress, RoomIndex } = comps;

  const toQuery: QueryFragment[] = [];
  if (options?.index) toQuery.push(HasValue(AccountIndex, { value: options.index }));
  if (options?.owner) toQuery.push(HasValue(OwnerAddress, { value: options.owner }));
  if (options?.operator) toQuery.push(HasValue(OperatorAddress, { value: options.operator }));
  if (options?.name) toQuery.push(HasValue(Name, { value: options.name }));
  if (options?.room) toQuery.push(HasValue(RoomIndex, { value: options.room }));
  toQuery.push(HasValue(EntityType, { value: 'ACCOUNT' })); // last bc fat

  const results = runQuery(toQuery);
  return Array.from(results);
};

// query for all account entities
export const queryAll = (comps: Components) => {
  return query(comps);
};

// query for an account entity by its index
export const queryByIndex = (comps: Components, index: number) => {
  if (!IndexCache.has(index)) {
    const results = query(comps, { index });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account index: ${index}`);
    if (length > 0) IndexCache.set(index, results[0]);
  }
  return IndexCache.get(index);
};

// query for an account entity by its name
export const queryByName = (comps: Components, name: string) => {
  if (!NameCache.has(name)) {
    const results = query(comps, { name });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account name: ${name}`);
    if (length > 1) NameCache.set(name, results[0]);
  }
  return NameCache.get(name);
};

// query for an account entity by its attached operator address
// todo: query directly with OperatorCacheComponent (operator address => accID)
// NOTE: technically this can change during the lifespan of the app
export const queryByOperator = (comps: Components, operator: string) => {
  if (!OperatorCache.has(operator)) {
    const results = query(comps, { operator });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account operator: ${operator}`);
    const result = results[0];
    if (length > 0 && result != 0) OperatorCache.set(operator, result);
  }
  return OperatorCache.get(operator);
};

// query for an account entity by its owner address
// todo: query directly! accID = formatEntityID(ownerAddr)
export const queryByOwner = (comps: Components, owner: string) => {
  if (!OwnerCache.has(owner)) {
    const results = query(comps, { owner });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account owner: ${owner}`);
    if (length > 1) OwnerCache.set(owner, results[0]);
  }
  return OwnerCache.get(owner);
};

// query for account entities by a room index
export const queryAllByRoom = (comps: Components, room: number) => {
  const results = query(comps, { room });
  return results;
};

// query an Account entity that owns a Kami (by entity)
export const queryForKami = (
  world: World,
  comps: Components,
  kamiEntity: EntityIndex
): EntityIndex | undefined => {
  if (!kamiEntity) return;
  const id = getKamiOwnerID(comps, kamiEntity);
  return world.entityToIndex.get(id);
};

/////////////////
// UTILS
// NOTE: these are functions built on top of actual query functions
// possibly move them elsewhere

// quuery for an account from the burner attached to the network layer
export const queryFromEmbedded = (network: NetworkLayer): EntityIndex => {
  const { components } = network;
  const connectedAddress = network.network.connectedAddress.get() ?? '';
  const result = queryByOperator(components, connectedAddress);
  return (result ?? 0) as EntityIndex;
};
