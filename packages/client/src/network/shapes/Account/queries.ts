import { EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'network/';

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
const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { AccountIndex, EntityType, Name, OwnerAddress, OperatorAddress, RoomIndex } = components;

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
export const queryAll = (components: Components) => {
  return query(components);
};

// query for an account entity by its index
export const queryByIndex = (components: Components, index: number) => {
  if (!IndexCache.has(index)) {
    const results = query(components, { index });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account index: ${index}`);
    if (length > 0) IndexCache.set(index, results[0]);
  }
  return IndexCache.get(index);
};

// query for an account entity by its name
export const queryByName = (components: Components, name: string) => {
  if (!NameCache.has(name)) {
    const results = query(components, { name });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account name: ${name}`);
    if (length > 1) NameCache.set(name, results[0]);
  }
  return NameCache.get(name);
};

// query for an account entity by its attached operator address
// todo: query directly with OperatorCacheComponent (operator address => accID)
// NOTE: technically this can change during the lifespan of the app
export const queryByOperator = (components: Components, operator: string) => {
  if (!OperatorCache.has(operator)) {
    const results = query(components, { operator });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account operator: ${operator}`);
    const result = results[0];
    if (length > 0 && result != 0) OperatorCache.set(operator, result);
  }
  return OperatorCache.get(operator);
};

// query for an account entity by its owner address
// todo: query directly! accID = formatEntityID(ownerAddr)
export const queryByOwner = (components: Components, owner: string) => {
  if (!OwnerCache.has(owner)) {
    const results = query(components, { owner });
    const length = results.length;
    if (length != 1) console.warn(`found ${length} entities for account owner: ${owner}`);
    if (length > 1) OwnerCache.set(owner, results[0]);
  }
  return OwnerCache.get(owner);
};

// query for account entities by a room index
export const queryAllByRoom = (components: Components, room: number) => {
  const results = query(components, { room });
  return results;
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
