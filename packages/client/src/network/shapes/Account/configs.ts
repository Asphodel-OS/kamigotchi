import { World } from '@mud-classic/recs';
import { getConfigArray, getConfigValue } from 'app/cache/config';
import { Components } from 'network/components';

export interface Configs {
  level: LevelConfig;
  stamina: StaminaConfig;
  trade: TradeConfig;
}

interface FixedPointValue {
  precision: number;
  raw: number;
  value: number;
}

export const getConfigs = (world: World, components: Components): Configs => {
  return {
    level: getLevelConfig(world, components),
    stamina: getStaminaConfig(world, components),
    trade: getTradeConfig(world, components),
  };
};

interface LevelConfig {
  base: number;
  compound: FixedPointValue;
}

// TODO: stitch this up with actual configs
export const getLevelConfig = (world: World, components: Components): LevelConfig => {
  return {
    base: 40,
    compound: { precision: 3, raw: 1259, value: 1259 / 10 ** 3 },
  };
};

interface StaminaConfig {
  base: number;
  recovery: number;
}

// TODO: stitch this up with updated stamina config
export const getStaminaConfig = (world: World, components: Components): StaminaConfig => {
  const value = getConfigArray(world, components, 'ACCOUNT_STAMINA');
  return {
    base: value[0],
    recovery: value[1],
  };
};

interface TradeConfig {
  fees: {
    creation: number;
    delivery: number;
  };
  tax: FixedPointValue;
}

// TODO: break out tax config on a per item basis eventually
export const getTradeConfig = (world: World, components: Components): TradeConfig => {
  const value = getConfigArray(world, components, 'TRADE_TAX_RATE');
  return {
    fees: {
      creation: getConfigValue(world, components, 'TRADE_CREATION_FEE'),
      delivery: getConfigValue(world, components, 'TRADE_DELIVERY_FEE'),
    },
    tax: {
      precision: value[0],
      raw: value[1],
      value: value[1] / 10 ** value[0],
    },
  };
};
