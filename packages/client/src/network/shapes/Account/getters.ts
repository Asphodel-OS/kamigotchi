import { EntityID, World } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'network/';
import { queryAll, queryByIndex, queryByName, queryByOperator, queryByOwner } from './queries';
import { NullAccount, Options, getAccount, getBaseAccount } from './types';

// get all accounts
export const getAll = (world: World, components: Components, options?: Options) => {
  const entities = queryAll(components);
  return entities.map((entity) => getAccount(world, components, entity, options));
};

// get all Base Accounts
export const getAllBase = (world: World, components: Components) => {
  const entities = queryAll(components);
  return entities.map((entity) => getBaseAccount(world, components, entity));
};

// get an Account, assuming the currently connected burner is the Operator
export const getFromBurner = (network: NetworkLayer, options?: Options) => {
  const { world, components } = network;
  const connectedAddress = network.network.connectedAddress.get();
  if (!connectedAddress) return NullAccount;
  return getByOperator(world, components, connectedAddress, options);
};

// get an Account by its entityID
export const getByID = (world: World, components: Components, id: EntityID, options?: Options) => {
  const entity = world.entityToIndex.get(id);
  if (!entity) return NullAccount;
  return getAccount(world, components, entity, options);
};

// get an Account by its AccountIndex
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
) => {
  const entity = queryByIndex(components, index);
  if (!entity) return NullAccount;
  return getAccount(world, components, entity, options);
};

// get an Account by its Operator EOA
export const getByOperator = (
  world: World,
  components: Components,
  operatorEOA: string,
  options?: Options
) => {
  const entity = queryByOperator(components, operatorEOA);
  if (!entity) return NullAccount;
  return getAccount(world, components, entity, options);
};

// get an Account by its Owner EOA
export const getByOwner = (
  world: World,
  components: Components,
  ownerEOA: string,
  options?: Options
) => {
  const entity = queryByOwner(components, ownerEOA);
  if (!entity) return NullAccount;
  return getAccount(world, components, entity, options);
};

// get an Account by its name
export const getByName = (
  world: World,
  components: Components,
  name: string,
  options?: Options
) => {
  const entity = queryByName(components, name);
  if (!entity) return NullAccount;
  return getAccount(world, components, entity, options);
};
