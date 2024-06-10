import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getBonusValue } from './types';

export interface Bonuses {
  attack: Attack;
  defense: Defense;
  harvest: Harvest;
  rest: Rest;
  general: General;
}

interface Attack {
  threshold: AsphoAST;
  spoils: AsphoAST;
}

interface Defense {
  threshold: AsphoAST;
  salvage: AsphoAST;
}

interface Harvest {
  fertility: AsphoAST;
  intensity: AsphoAST;
  bounty: AsphoAST;
}

interface Rest {
  metabolism: AsphoAST;
}

interface General {
  strain: AsphoAST;
  cooldown: number;
}

interface AsphoAST {
  nudge: number;
  ratio: number;
  shift: number;
  boost: number;
}

// gets the bonuses based on the entity index of a kami
// pass in precisions here using the actual config rather than hardcoding
export const getBonuses = (
  world: World,
  components: Components,
  entityIndex: EntityIndex // kami entity index
): Bonuses => {
  const holderID = world.entities[entityIndex];

  const bonuses = {
    attack: {
      threshold: {
        nudge: 0,
        ratio: getBonusValue(world, components, holderID, 'ATK_THRESHOLD_RATIO', 3),
        shift: getBonusValue(world, components, holderID, 'ATK_THRESHOLD_SHIFT', 3),
        boost: 0,
      },
      spoils: {
        nudge: 0,
        ratio: getBonusValue(world, components, holderID, 'ATK_SPOILS_RATIO', 3),
        shift: 0,
        boost: 0,
      },
    },
    defense: {
      threshold: {
        nudge: 0,
        ratio: getBonusValue(world, components, holderID, 'DEF_THRESHOLD_RATIO', 3),
        shift: getBonusValue(world, components, holderID, 'DEF_THRESHOLD_SHIFT', 3),
        boost: 0,
      },
      salvage: {
        nudge: 0,
        ratio: getBonusValue(world, components, holderID, 'DEF_SALVAGE_RATIO', 3),
        shift: 0,
        boost: 0,
      },
    },
    harvest: {
      fertility: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonusValue(world, components, holderID, 'HARV_FERTILITY_BOOST', 3),
      },
      intensity: {
        nudge: getBonusValue(world, components, holderID, 'HARV_INTENSITY_NUDGE', 0),
        ratio: 0,
        shift: 0,
        boost: 0,
      },
      bounty: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonusValue(world, components, holderID, 'HARV_BOUNTY_BOOST', 3),
      },
    },
    rest: {
      metabolism: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonusValue(world, components, holderID, 'REST_METABOLISM_BOOST', 3),
      },
    },
    general: {
      strain: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonusValue(world, components, holderID, 'STND_STRAIN_BOOST', 3),
      },
      cooldown: getBonusValue(world, components, holderID, 'STND_COOLDOWN_SHIFT', 0),
    },
  };

  return bonuses;
};
