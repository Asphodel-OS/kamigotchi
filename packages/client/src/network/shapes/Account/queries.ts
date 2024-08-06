import { EntityID, EntityIndex, Has, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'network/';
import { AccountOptions, NullAccount, getAccount, getBaseAccount } from './types';

export type QueryOptions = {
  index?: number;
  operator?: string;
  owner?: string;
  name?: string;
};

//////////////////
// EXTERNAL

// get an Account by its Username
export const getAccountEntityIndexByName = (components: Components, name: string) => {
  const { IsAccount, Name } = components;
  return Array.from(runQuery([Has(IsAccount), HasValue(Name, { value: name })]))[0];
};

// get an Account by its Owner Address
export const getAccountEntityIndexByOwner = (components: Components, address: string) => {
  const { IsAccount, OwnerAddress } = components;
  return Array.from(runQuery([Has(IsAccount), HasValue(OwnerAddress, { value: address })]))[0];
};

// get all accounts
export const getAllAccounts = (world: World, components: Components, options?: AccountOptions) => {
  const { IsAccount } = components;
  return Array.from(runQuery([Has(IsAccount)])).map((entityIndex) =>
    getAccount(world, components, entityIndex, options)
  );
};

export const getAllAccountsBare = (world: World, components: Components) => {
  const { IsAccount } = components;
  return Array.from(runQuery([Has(IsAccount)])).map((entityIndex) =>
    getBaseAccount(world, components, entityIndex)
  );
};

// get an Account, assuming the currently connected burner is the Operator
export const getAccountFromBurner = (network: NetworkLayer, options?: AccountOptions) => {
  const { world, components } = network;
  const connectedAddress = network.network.connectedAddress.get();
  return getAccountByOperator(world, components, connectedAddress ?? '', options);
};

//////////////////
// GETTERS

// get an Account by its entityID
export const getAccountByID = (
  world: World,
  components: Components,
  id: EntityID,
  options?: AccountOptions
) => {
  return getAccount(world, components, world.entityToIndex.get(id) as EntityIndex, options);
};

// get an Account by its AccountIndex
export const getAccountByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: AccountOptions
) => {
  const { IsAccount, AccountIndex } = components;
  const entityIndex = Array.from(
    runQuery([
      HasValue(AccountIndex, { value: index }), // NOTE: may cause issues if not 0x{hex} formatted
      Has(IsAccount),
    ])
  )[0];
  return getAccount(world, components, entityIndex, options);
};

// get an Account by its Operator EOA
export const getAccountByOperator = (
  world: World,
  components: Components,
  operatorEOA: string,
  options?: AccountOptions
) => {
  const { IsAccount, OperatorAddress } = components;
  const entityIndices = Array.from(
    runQuery([HasValue(OperatorAddress, { value: operatorEOA }), Has(IsAccount)])
  );
  if (entityIndices.length === 0) return NullAccount;
  return getAccount(world, components, entityIndices[0], options);
};

// get an Account by its Owner EOA
export const getAccountByOwner = (
  world: World,
  components: Components,
  ownerEOA: string,
  options?: AccountOptions
) => {
  const { IsAccount, OwnerAddress } = components;
  const entityIndex = Array.from(
    runQuery([HasValue(OwnerAddress, { value: ownerEOA }), Has(IsAccount)])
  )[0];
  if (entityIndex) return getAccount(world, components, entityIndex, options);
};

export const getAccountByName = (
  world: World,
  components: Components,
  name: string,
  options?: AccountOptions
) => {
  const { IsAccount, Name } = components;
  const entityIndex = Array.from(runQuery([HasValue(Name, { value: name }), Has(IsAccount)]))[0];
  return getAccount(world, components, entityIndex, options);
};
