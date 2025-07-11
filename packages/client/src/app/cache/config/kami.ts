import { World } from '@mud-classic/recs';

import { Components } from 'network/comps';
import { AsphoAST, Efficacy, KamiConfigs } from 'network/shapes/Kami';
import { getArray, getValue } from './base';

// construct the kami config object based on known keys and shapes
// NOTE: these values get cached with no live updates to the ui layer. updates require refresh
export const getKamiConfig = (world: World, comps: Components): KamiConfigs => {
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

// retrieve a full AsphoAST config from its key
const getASTNode = (world: World, comps: Components, key: string): AsphoAST => {
  const configArray = getArray(world, comps, key);
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
const getEfficacyNode = (world: World, comps: Components, key: string): Efficacy => {
  const configArray = getArray(world, comps, key);

  const precision = 10 ** configArray[0];
  return {
    base: configArray[1] / precision,
    up: configArray[2] / precision,
    down: -configArray[3] / precision,
  };
};
