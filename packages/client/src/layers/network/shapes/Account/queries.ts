import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';

import { getAccount, AccountOptions } from "./types";
import { NetworkLayer } from 'layers/network/types';


export const getAllAccounts = (network: NetworkLayer, options?: AccountOptions) => {
  const { components: { IsAccount } } = network;
  return Array.from(
    runQuery([
      Has(IsAccount),
    ])
  ).map((entityIndex) => getAccount(network, entityIndex, options));
}

// get an Account by its entityID
export const getAccountByID = (
  network: NetworkLayer,
  id: EntityID,
  options?: AccountOptions
) => {
  const { world } = network;
  return getAccount(
    network,
    world.entityToIndex.get(id) as EntityIndex,
    options
  );
}

// get an Account by its AccountIndex
export const getAccountByIndex = (
  network: NetworkLayer,
  index: number,
  options?: AccountOptions
) => {
  const { components: { IsAccount, AccountIndex } } = network;
  const entityIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(AccountIndex, { value: index }), // NOTE: may cause issues if not 0x{hex} formatted
    ])
  )[0];
  return getAccount(network, entityIndex, options);
}

// get an Account by its Username
export const getAccountByName = (
  network: NetworkLayer,

  name: string,
  options?: AccountOptions
) => {
  const { components: { IsAccount, Name } } = network;
  const entityIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(Name, { value: name }),
    ])
  )[0];
  return getAccount(network, entityIndex, options);
}

// get an Account by its Operator EOA
export const getAccountByOperator = (
  network: NetworkLayer,

  operatorEOA: string,
  options?: AccountOptions
) => {
  const { components: { IsAccount, OperatorAddress } } = network;
  const entityIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OperatorAddress, { value: operatorEOA }),
    ])
  )[0];
  return getAccount(network, entityIndex, options);
}

// get an Account by its Owner EOA
export const getAccountByOwner = (
  network: NetworkLayer,
  ownerEOA: string,
  options?: AccountOptions
) => {
  const { components: { IsAccount, OwnerAddress } } = network;
  const entityIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OwnerAddress, { value: ownerEOA }),
    ])
  )[0];
  return getAccount(network, entityIndex, options);
}

// get an Account, assuming the currently connected burner is the Operator
export const getAccountFromBurner = (network: NetworkLayer, options?: AccountOptions) => {
  const connectedBurner = network.network.connectedAddress.get();
  return getAccountByOperator(network, connectedBurner!, options);
};

