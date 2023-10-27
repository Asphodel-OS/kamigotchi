import { EntityID, EntityIndex, Has, HasValue, Layers, getComponentValue, runQuery } from "@latticexyz/recs";

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
export const getBonuses = (layers: Layers, entityIndex: EntityIndex): Bonuses => {
  const { network: { world } } = layers;
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
      output: (getBonusValue(layers, holderID, 'HARVEST_OUTPUT') ?? 1000) * 1,
      drain: (getBonusValue(layers, holderID, 'HARVEST_DRAIN') ?? 1000) * 1,
      cooldown: 0,
    },
  };

  return bonuses;
}

const getBonusValue = (layers: Layers, holderID: EntityID, type: string): number | undefined => {
  const {
    network: {
      components: {
        IsBonus,
        HolderID,
        Type,
        Value,
      },
    },
  } = layers;

  const results = Array.from(
    runQuery([
      Has(IsBonus),
      HasValue(HolderID, { value: holderID }),
      HasValue(Type, { value: type }),
    ])
  );

  if (results.length > 0) {
    return getComponentValue(Value, results[0])?.value as number | undefined;
  }
}