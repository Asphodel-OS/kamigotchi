import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccount } from './Account';
import { Production, getProduction } from './Production';
import { Stats, getStats } from './Stats';

// standardized shape of a Kami Entity
export interface Kami {
  id: EntityID;
  index: string;
  name: string;
  uri: string;
  health: number;
  lastUpdated: number;
  account?: Account;
  production?: Production;
  stats: Stats;
  // traits?: Traits;
}

// optional data to populate for a Kami Entity
export interface KamiOptions {
  account?: boolean;
  production?: boolean;
  traits?: boolean;
}

// get a Kami from its EnityIndex. includes options for which data to include
export const getKami = (
  layers: Layers,
  index: EntityIndex,
  options?: KamiOptions
): Kami => {
  const {
    network: {
      world,
      components: {
        AccountID,
        HealthCurrent,
        IsProduction,
        LastActionTime,
        MediaURI,
        Name,
        PetID,
        PetIndex,
      },
    },
  } = layers;

  // populate the base Kami data
  let kami: Kami = {
    id: world.entities[index],
    index: getComponentValue(PetIndex, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    uri: getComponentValue(MediaURI, index)?.value as string,
    health: getComponentValue(HealthCurrent, index)?.value as number,
    lastUpdated: getComponentValue(LastActionTime, index)?.value as number,
    stats: getStats(layers, index),
  };

  /////////////////
  // OPTIONAL DATA

  if (!options) return kami;

  // populate Account
  if (options.account) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountIndex = world.entityToIndex.get(accountID);
    if (accountIndex) kami.account = getAccount(layers, accountIndex);
  }

  // populate Production
  if (options.production) {
    const productionIndex = Array.from(
      runQuery([Has(IsProduction), HasValue(PetID, { value: kami.id })])
    )[0];
    if (productionIndex)
      kami.production = getProduction(layers, productionIndex, { node: true });
  }

  return kami;
};
