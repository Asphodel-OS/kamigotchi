import { EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'network/';

export type QueryOptions = {
  index?: number;
  operator?: string;
  owner?: string;
  name?: string;
};

export const queryFromBurner = (network: NetworkLayer): EntityIndex => {
  const { components } = network;
  const connectedAddress = network.network.connectedAddress.get();
  return (queryByOperator(components, connectedAddress ?? '') ?? 0) as EntityIndex;
};

// query Account entities generally with query options. return matching entity indices
const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { AccountIndex, EntityType, Name, OwnerAddress, OperatorAddress } = components;
  const toQuery: QueryFragment[] = [HasValue(EntityType, { value: 'ACCOUNT' })];
  if (options?.index) toQuery.push(HasValue(AccountIndex, { value: options.index }));
  if (options?.name) toQuery.push(HasValue(Name, { value: options.name }));
  if (options?.owner) toQuery.push(HasValue(OwnerAddress, { value: options.owner }));
  if (options?.operator) toQuery.push(HasValue(OperatorAddress, { value: options.operator }));
  return Array.from(runQuery(toQuery));
};

// query for all account entities
export const queryAll = (components: Components) => {
  return query(components);
};

// query for an account entity by its owner address
export const queryByOwner = (components: Components, owner: string) => {
  const results = query(components, { owner });
  if (results.length == 0) return;
  return results[0];
};

// query for an account entity by its operator address
export const queryByOperator = (components: Components, operator: string) => {
  const results = query(components, { operator });
  if (results.length == 0) return;
  return results[0];
};

// query for an account entity by its name
export const queryByName = (components: Components, name: string) => {
  const results = query(components, { name });
  if (results.length == 0) return;
  return results[0];
};

// query for an account entity by its index
export const queryByIndex = (components: Components, index: number) => {
  const results = query(components, { index });
  if (results.length == 0) return;
  return results[0];
};
