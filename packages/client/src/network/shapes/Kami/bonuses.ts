import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getBonusValue } from '../Bonus/getters';

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
  strain: AsphoAST;
}

interface Rest {
  metabolism: AsphoAST;
}

interface General {
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

  const getBonus = (key: string, precision: number): number => {
    return getBonusValue(world, components, key, holderID, precision);
  };

  const bonuses = {
    attack: {
      threshold: {
        nudge: 0,
        ratio: getBonus('ATK_THRESHOLD_RATIO', 3),
        shift: getBonus('ATK_THRESHOLD_SHIFT', 3),
        boost: 0,
      },
      spoils: {
        nudge: 0,
        ratio: getBonus('ATK_SPOILS_RATIO', 3),
        shift: 0,
        boost: 0,
      },
    },
    defense: {
      threshold: {
        nudge: 0,
        ratio: getBonus('DEF_THRESHOLD_RATIO', 3),
        shift: getBonus('DEF_THRESHOLD_SHIFT', 3),
        boost: 0,
      },
      salvage: {
        nudge: 0,
        ratio: getBonus('DEF_SALVAGE_RATIO', 3),
        shift: 0,
        boost: 0,
      },
    },
    harvest: {
      fertility: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonus('HARV_FERTILITY_BOOST', 3),
      },
      intensity: {
        nudge: getBonus('HARV_INTENSITY_NUDGE', 0),
        ratio: 0,
        shift: 0,
        boost: 0,
      },
      bounty: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonus('HARV_BOUNTY_BOOST', 3),
      },
      strain: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonus('STND_STRAIN_BOOST', 3),
      },
    },
    rest: {
      metabolism: {
        nudge: 0,
        ratio: 0,
        shift: 0,
        boost: getBonus('REST_METABOLISM_BOOST', 3),
      },
    },
    general: {
      cooldown: getBonus('STND_COOLDOWN_SHIFT', 0),
    },
  };

  return bonuses;
};
