import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { getAccount, AccountOptions } from "./types";

// get an Account from its entityID
export const getAccountByID = (
  layers: Layers,
  id: EntityID,
  options?: AccountOptions
) => {
  const { network: { world } } = layers;
  return getAccount(
    layers,
    world.entityToIndex.get(id) as EntityIndex,
    options
  );
}

// get an Account from its Username
export const getAccountByName = (
  layers: Layers,
  name: string,
  options?: AccountOptions
) => {
  const { network: { components: { IsAccount, Name } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(Name, { value: name }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account from its Operator address
export const getAccountByOperator = (
  layers: Layers,
  operatorEOA: string,
  options?: AccountOptions
) => {
  const { network: { components: { IsAccount, OperatorAddress } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OperatorAddress, { value: operatorEOA }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account from its Owner address
export const getAccountByOwner = (
  layers: Layers,
  ownerEOA: string,
  options?: AccountOptions
) => {
  const { network: { components: { IsAccount, OwnerAddress } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OwnerAddress, { value: ownerEOA }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account, assuming the currently connected burner is the Operator
export const getAccountFromBurner = (layers: Layers, options?: AccountOptions) => {
  const { network: { network } } = layers;
  return getAccountByOperator(layers, network.connectedAddress.get()!, options);
};