import { World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getConfigFieldValue } from '../Config';

export interface Configs {
  level: LevelConfig;
  stamina: StaminaConfig;
}
interface LevelConfig {
  base: number;
  compound: FixedPointValue;
}

interface StaminaConfig {
  base: number;
  recovery: number;
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
  };
};

// TODO: stitch this up with actual configs
export const getLevelConfig = (world: World, components: Components): LevelConfig => {
  return {
    base: 40,
    compound: { precision: 3, raw: 1259, value: 1259 / 10 ** 3 },
  };
};

// TODO: stitch this up with updated stamina config
export const getStaminaConfig = (world: World, components: Components): StaminaConfig => {
  return {
    base: getConfigFieldValue(world, components, 'ACCOUNT_STAMINA_BASE'),
    recovery: getConfigFieldValue(world, components, 'ACCOUNT_STAMINA_RECOVERY_PERIOD'),
  };
};
