import { EntityID, World } from '@mud-classic/recs';

import { ONYX_INDEX } from 'constants/items';
import { ONYX_RENAME_PRICE, ONYX_RESPEC_PRICE, ONYX_REVIVE_PRICE } from 'constants/prices';
import { Components } from 'network/';
import { getData } from './types';

const DECIMALS = 3;

type SpendStat = {
  count: number;
  price: number;
  total: number; // total value spent
};

type OnyxSpends = {
  rename: SpendStat;
  respec: SpendStat;
  revive: SpendStat;
};

export const getAll = (world: World, comps: Components): OnyxSpends => {
  return {
    rename: getRenameSpend(world, comps),
    respec: getRespecSpend(world, comps),
    revive: getReviveSpend(world, comps),
  };
};

export const getRenameSpend = (world: World, comps: Components): SpendStat => {
  const precision = 10 ** DECIMALS;
  const price = ONYX_RENAME_PRICE;

  const rawSpend = getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_RENAME', ONYX_INDEX);
  const total = rawSpend / precision;
  const count = total / price;

  return { count, price, total };
};

export const getRespecSpend = (world: World, comps: Components): SpendStat => {
  const precision = 10 ** DECIMALS;
  const price = ONYX_RESPEC_PRICE;

  const rawSpend = getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_RESPEC', ONYX_INDEX);
  const total = rawSpend / precision;
  const count = total / price;

  return { count, price, total };
};

export const getReviveSpend = (world: World, comps: Components): SpendStat => {
  const precision = 10 ** DECIMALS;
  const price = ONYX_REVIVE_PRICE;
  const rawSpend = getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_REVIVE', ONYX_INDEX);
  const total = rawSpend / precision;
  const count = total / price;

  return { count, price, total };
};
