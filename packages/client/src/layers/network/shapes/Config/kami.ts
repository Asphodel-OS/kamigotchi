import { World } from '@mud-classic/recs';

import { Components } from 'layers/network/components';
import { getConfigFieldValue, getConfigFieldValueArray } from './types';

export interface Config {
  harvest: HarvestConfig;
  liquidation: LiquidationConfig;
  rest: RestConfig;
  general: GeneralConfig;
}

interface HarvestConfig {
  fertility: AsphoAST;
  bounty: AsphoAST;
  efficacy: Efficacy;
}

interface LiquidationConfig {
  animosity: AsphoAST;
  threshold: AsphoAST;
  // salvage: AsphoAST;
  // spoils: AsphoAST;
  efficacy: Efficacy;
}

interface RestConfig {
  metabolism: AsphoAST;
  recovery: AsphoAST;
}

interface GeneralConfig {
  strain: AsphoAST;
  cooldown: number;
}

interface AsphoAST {
  nudge: FixedPointValue;
  ratio: FixedPointValue;
  shift: FixedPointValue;
  boost: FixedPointValue;
}

interface FixedPointValue {
  precision: number;
  raw: number;
  value: number;
}

interface Efficacy {
  base: number;
  up: number;
  down: number;
}

export const getConfig = (world: World, components: Components): Config => {
  return {
    harvest: {
      fertility: getASTNode(world, components, 'KAMI_HARV_FERTILITY'),
      bounty: getASTNode(world, components, 'KAMI_HARV_BOUNTY'),
      efficacy: getEfficacyNode(world, components, 'KAMI_HARV_EFFICACY'),
    },
    liquidation: {
      animosity: getASTNode(world, components, 'KAMI_LIQ_ANIMOSITY'),
      threshold: getASTNode(world, components, 'KAMI_LIQ_THRESHOLD'),
      // salvage: getASTNode(world, components, 'KAMI_LIQ_SALVAGE'),
      // spoils: getASTNode(world, components, 'KAMI_LIQ_SPOILS'),
      efficacy: getEfficacyNode(world, components, 'KAMI_LIQ_EFFICACY'),
    },
    rest: {
      metabolism: getASTNode(world, components, 'KAMI_REST_METABOLISM'),
      recovery: getASTNode(world, components, 'KAMI_REST_RECOVERY'),
    },
    general: {
      strain: getASTNode(world, components, 'KAMI_MUSU_STRAIN'),
      cooldown: getConfigFieldValue(world, components, 'KAMI_COOLDOWN'),
    },
  };
};

// retrieve a full AsphoAST config from its key
export const getASTNode = (world: World, components: Components, key: string): AsphoAST => {
  const configArray = getConfigFieldValueArray(world, components, key);
  return {
    nudge: {
      precision: configArray[1],
      raw: configArray[0],
      value: configArray[0] / 10 ** configArray[1],
    },
    ratio: {
      precision: configArray[3],
      raw: configArray[2],
      value: configArray[2] / 10 ** configArray[3],
    },
    shift: {
      precision: configArray[5],
      raw: configArray[4],
      value: configArray[4] / 10 ** configArray[5],
    },
    boost: {
      precision: configArray[7],
      raw: configArray[6],
      value: configArray[6] / 10 ** configArray[7],
    },
  };
};

// get an efficacy config node from its key
export const getEfficacyNode = (world: World, components: Components, key: string): Efficacy => {
  const configArray = getConfigFieldValueArray(world, components, key);
  return {
    base: configArray[0] / 10 ** configArray[3],
    up: configArray[1] / 10 ** configArray[3],
    down: -configArray[2] / 10 ** configArray[3],
  };
};
