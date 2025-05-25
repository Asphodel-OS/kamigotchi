import { EntityID, World } from '@mud-classic/recs';

import { ONYX_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getData } from './types';

const DECIMALS = 3;

type OnyxSpends = {
  rename: number;
  respec: number;
  revive: number;
};

export const getAll = (world: World, comps: Components): OnyxSpends => {
  const precision = 10 ** DECIMALS;

  return {
    rename: getRenameSpend(world, comps) / precision,
    respec: getRespecSpend(world, comps) / precision,
    revive: getReviveSpend(world, comps) / precision,
  };
};

export const getRenameSpend = (world: World, comps: Components): number => {
  return getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_RENAME', ONYX_INDEX);
};

export const getRespecSpend = (world: World, comps: Components): number => {
  return getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_RESPEC', ONYX_INDEX);
};

export const getReviveSpend = (world: World, comps: Components): number => {
  return getData(world, comps, '0' as EntityID, 'TOKEN_SPEND_REVIVE', ONYX_INDEX);
};
