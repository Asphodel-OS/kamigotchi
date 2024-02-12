import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Layers,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';
import { NetworkLayer } from 'layers/network/types';

export interface Bonuses {
  attack: AttackBonus;
  defense: DefenseBonus;
  harvest: HarvestBonus;
}

interface HarvestBonus {
  output: number;
  drain: number;
  cooldown?: number;
}

interface AttackBonus {
  bounty: number;
  threshold: number;
  multiplier: number;
  cooldown: number;
}

interface DefenseBonus {
  bounty: number;
  threshold: number;
  multiplier: number;
}

// gets the bonuses based on the entity index of a kami
export const getBonuses = (
  network: NetworkLayer,
  entityIndex: EntityIndex
): Bonuses => {
  const { world } = network;
  const holderID = world.entities[entityIndex];

  const bonuses = {
    attack: {
      bounty: 100,
      threshold: 0,
      multiplier: 100,
      cooldown: 0,
    },
    defense: {
      bounty: 100,
      threshold: 0,
      multiplier: 100,
    },
    harvest: {
      output: (getBonusValue(network, holderID, 'HARVEST_OUTPUT') ?? 1000) * 1,
      drain: (getBonusValue(network, holderID, 'HARVEST_DRAIN') ?? 1000) * 1,
      cooldown: 0,
    },
  };

  return bonuses;
};

export const getBonusValue = (
  network: NetworkLayer,
  holderID: EntityID,
  type: string
): number | undefined => {
  const {
    components: { IsBonus, HolderID, Type, Value },
  } = network;

  const results = Array.from(
    runQuery([
      Has(IsBonus),
      HasValue(HolderID, { value: holderID }),
      HasValue(Type, { value: type }),
    ])
  );

  // NOTE: different bonus types have different default values, so we return undefined when missing
  // the caller must determine what the actual value is when the bonus is missing
  return results.length > 0
    ? (getComponentValue(Value, results[0])?.value as number | undefined)
    : undefined;
};
