import { EntityID, EntityIndex, Has, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components, NetworkLayer } from 'layers/network';
import { AccountOptions, getAccount } from './types';

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
      Has(IsAccount),
      HasValue(AccountIndex, { value: index }), // NOTE: may cause issues if not 0x{hex} formatted
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
  const entityIndex = Array.from(
    runQuery([Has(IsAccount), HasValue(OperatorAddress, { value: operatorEOA })])
  )[0];
  return getAccount(world, components, entityIndex, options);
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
    runQuery([Has(IsAccount), HasValue(OwnerAddress, { value: ownerEOA })])
  )[0];
  if (entityIndex) return getAccount(world, components, entityIndex, options);
};

// get an Account, assuming the currently connected burner is the Operator
export const getAccountFromBurner = (network: NetworkLayer, options?: AccountOptions) => {
  const { world, components } = network;
  const connectedAddress = network.network.connectedAddress.get();
  return getAccountByOperator(world, components, connectedAddress ?? '', options);
};
