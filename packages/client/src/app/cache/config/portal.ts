import { World } from 'engine/recs';
import { Components } from 'network/components';
import { getArray, getValue } from './base';

export interface Configs {
  delay: number;
  tax: {
    import: TaxConfig;
    export: TaxConfig;
  };
}

interface TaxConfig {
  flat: number;
  rate: number;
}

export const getConfig = (world: World, comps: Components): Configs => {
  return {
    delay: getValue(world, comps, 'PORTAL_TOKEN_EXPORT_DELAY'),
    tax: {
      import: getTaxConfig(world, comps, 'PORTAL_ITEM_IMPORT_TAX'),
      export: getTaxConfig(world, comps, 'PORTAL_ITEM_EXPORT_TAX'),
    },
  };
};

const getTaxConfig = (world: World, comps: Components, key: string): TaxConfig => {
  const configArray = getArray(world, comps, key);
  return {
    flat: configArray[0],
    rate: configArray[1] / 1e4,
  };
};
