import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getConfigValue } from '.';

export type MintConstraints = {
  max: number;
  price: number;
  startTs: number;
};

// TODO: figure out where to put this
export type GachaMintConfig = {
  total: number;
  whitelist: MintConstraints;
  public: MintConstraints;
};

// get the config for the gacha ticket mint
export const getMintConfig = (world: World, components: Components): GachaMintConfig => {
  return {
    total: getConfigValue(world, components, 'MINT_MAX_TOTAL'),
    whitelist: {
      max: getConfigValue(world, components, 'MINT_MAX_WL'),
      price: getConfigValue(world, components, 'MINT_PRICE_WL'),
      startTs: getConfigValue(world, components, 'MINT_START_WL'),
    },
    public: {
      max: getConfigValue(world, components, 'MINT_MAX_PUBLIC'),
      price: getConfigValue(world, components, 'MINT_PRICE_PUBLIC'),
      startTs: getConfigValue(world, components, 'MINT_START_PUBLIC'),
    },
  };
};
