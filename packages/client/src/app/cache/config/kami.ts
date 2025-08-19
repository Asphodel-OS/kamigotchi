import { World } from '@mud-classic/recs';

import { Components } from 'network/comps';
import { AsphoAST, Efficacy, KamiConfigs } from 'network/shapes/Kami';
import { getArray, getValue, processArray, processValue } from './base';

// construct the kami config object based on known keys and shapes
// NOTE: these values get cached with no live updates to the ui layer. updates require refresh
export const getConfig = (world: World, comps: Components): KamiConfigs => {
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
      cooldown: getValue(world, comps, 'KAMI_STANDARD_COOLDOWN'),
      skills: getArray(world, comps, 'KAMI_TREE_REQ'),
    },
  };
};

// (re)process the kami config object based on known keys and shapes
export const processConfig = (world: World, comps: Components): KamiConfigs => {
  return {
    harvest: {
      bounty: processASTNode(world, comps, 'KAMI_HARV_BOUNTY'),
      efficacy: {
        body: processEfficacyNode(world, comps, 'KAMI_HARV_EFFICACY_BODY'),
        hand: processEfficacyNode(world, comps, 'KAMI_HARV_EFFICACY_HAND'),
      },
      fertility: processASTNode(world, comps, 'KAMI_HARV_FERTILITY'),
      intensity: processASTNode(world, comps, 'KAMI_HARV_INTENSITY'),
      strain: processASTNode(world, comps, 'KAMI_HARV_STRAIN'),
    },
    liquidation: {
      animosity: processASTNode(world, comps, 'KAMI_LIQ_ANIMOSITY'),
      efficacy: processEfficacyNode(world, comps, 'KAMI_LIQ_EFFICACY'),
      threshold: processASTNode(world, comps, 'KAMI_LIQ_THRESHOLD'),
      salvage: processASTNode(world, comps, 'KAMI_LIQ_SALVAGE'),
      spoils: processASTNode(world, comps, 'KAMI_LIQ_SPOILS'),
      karma: processASTNode(world, comps, 'KAMI_LIQ_KARMA'),
      recoil: processASTNode(world, comps, 'KAMI_LIQ_RECOIL'),
    },
    rest: {
      metabolism: processASTNode(world, comps, 'KAMI_REST_METABOLISM'),
      recovery: processASTNode(world, comps, 'KAMI_REST_RECOVERY'),
    },
    general: {
      cooldown: processValue(world, comps, 'KAMI_STANDARD_COOLDOWN'),
      skills: processArray(world, comps, 'KAMI_TREE_REQ'),
    },
  };
};

/////////////////
// AST NODES

// retrieve a full AsphoAST config from its key
const getASTNode = (world: World, comps: Components, key: string): AsphoAST => {
  const configArray = getArray(world, comps, key);
  return structureASTNode(configArray);
};

// process a full AsphoAST config from its key
const processASTNode = (world: World, comps: Components, key: string): AsphoAST => {
  const configArray = processArray(world, comps, key);
  return structureASTNode(configArray);
};

const structureASTNode = (config: number[]): AsphoAST => {
  return {
    nudge: {
      raw: config[0],
      precision: config[1],
      value: config[0] / 10 ** config[1],
    },
    ratio: {
      raw: config[2],
      precision: config[3],
      value: config[2] / 10 ** config[3],
    },
    shift: {
      raw: config[4],
      precision: config[5],
      value: config[4] / 10 ** config[5],
    },
    boost: {
      raw: config[6],
      precision: config[7],
      value: config[6] / 10 ** config[7],
    },
  };
};

/////////////////
// EFFICACY NODES

// get an efficacy config node for liquidation
const getEfficacyNode = (world: World, comps: Components, key: string): Efficacy => {
  const configArray = getArray(world, comps, key);
  return structureEfficacyNode(configArray);
};

// process an efficacy config node for liquidation
const processEfficacyNode = (world: World, comps: Components, key: string): Efficacy => {
  const configArray = processArray(world, comps, key);
  return structureEfficacyNode(configArray);
};

const structureEfficacyNode = (config: number[]): Efficacy => {
  const precision = 10 ** config[0];
  return {
    base: config[1] / precision,
    up: config[2] / precision,
    down: -config[3] / precision,
    special: config[4] / precision,
  };
};
