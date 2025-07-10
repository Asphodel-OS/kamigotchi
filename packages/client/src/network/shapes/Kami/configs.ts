import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getConfigFieldValue, getConfigFieldValueArray } from '../Config/types';

export interface Configs {
  harvest: HarvestConfig;
  liquidation: LiquidationConfig;
  rest: RestConfig;
  general: GeneralConfig;
}

interface HarvestConfig {
  bounty: AsphoAST;
  fertility: AsphoAST;
  efficacy: {
    body: Efficacy;
    hand: Efficacy;
  };
  intensity: AsphoAST;
  strain: AsphoAST;
}

interface LiquidationConfig {
  animosity: AsphoAST;
  efficacy: Efficacy;
  threshold: AsphoAST;
  salvage: AsphoAST;
  spoils: AsphoAST;
  karma: AsphoAST;
  recoil: AsphoAST;
}

interface RestConfig {
  metabolism: AsphoAST;
  recovery: AsphoAST;
}

interface GeneralConfig {
  cooldown: number;
  skills: number[];
}

export interface AsphoAST {
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

export interface Efficacy {
  base: number;
  up: number;
  down: number;
}

// get the full config of a Kami
// NOTE: we should not rely on this and instead use the functions found in
// app/cache/config/ as those are optimized with the latest config data
export const getConfigs = (world: World, comps: Components): Configs => {
  return {
    harvest: {
      bounty: getASTNode(world, comps, 'KAMI_HARV_BOUNTY'),
      efficacy: {
        body: getEfficacyNode(world, comps, 'KAMI_HARV_EFFICACY_BODY'),
        hand: getEfficacyNode(world, comps, 'KAMI_HARV_EFFICACY_HAND'),
      },
      fertility: getASTNode(world, comps, 'KAMI_HARV_FERTILITY'),
      intensity: getASTNode(world, comps, 'KAMI_HARV_INTENSITY'),
      strain: getASTNode(world, comps, 'KAMI_HARV_STRAIN'),
    },
    liquidation: {
      animosity: getASTNode(world, comps, 'KAMI_LIQ_ANIMOSITY'),
      efficacy: getEfficacyNode(world, comps, 'KAMI_LIQ_EFFICACY'),
      threshold: getASTNode(world, comps, 'KAMI_LIQ_THRESHOLD'),
      salvage: getASTNode(world, comps, 'KAMI_LIQ_SALVAGE'),
      spoils: getASTNode(world, comps, 'KAMI_LIQ_SPOILS'),
      karma: getASTNode(world, comps, 'KAMI_LIQ_KARMA'),
      recoil: getASTNode(world, comps, 'KAMI_LIQ_RECOIL'),
    },
    rest: {
      metabolism: getASTNode(world, comps, 'KAMI_REST_METABOLISM'),
      recovery: getASTNode(world, comps, 'KAMI_REST_RECOVERY'),
    },
    general: {
      cooldown: getConfigFieldValue(world, comps, 'KAMI_STANDARD_COOLDOWN'),
      skills: getConfigFieldValueArray(world, comps, 'KAMI_TREE_REQ'),
    },
  };
};

// retrieve a full AsphoAST config from its key
export const getASTNode = (world: World, comps: Components, key: string): AsphoAST => {
  const configArray = getConfigFieldValueArray(world, comps, key);
  return {
    nudge: {
      raw: configArray[0],
      precision: configArray[1],
      value: configArray[0] / 10 ** configArray[1],
    },
    ratio: {
      raw: configArray[2],
      precision: configArray[3],
      value: configArray[2] / 10 ** configArray[3],
    },
    shift: {
      raw: configArray[4],
      precision: configArray[5],
      value: configArray[4] / 10 ** configArray[5],
    },
    boost: {
      raw: configArray[6],
      precision: configArray[7],
      value: configArray[6] / 10 ** configArray[7],
    },
  };
};

// get an efficacy config node for liquidation
export const getEfficacyNode = (world: World, comps: Components, key: string): Efficacy => {
  const configArray = getConfigFieldValueArray(world, comps, key);

  const precision = 10 ** configArray[0];
  return {
    base: configArray[1] / precision,
    up: configArray[2] / precision,
    down: -configArray[3] / precision,
  };
};
