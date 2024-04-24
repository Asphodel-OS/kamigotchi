import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { BigNumber, utils } from 'ethers';
import { Components } from 'layers/network';

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
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Bonuses => {
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
      output: (getBonusValue(world, components, holderID, 'HARVEST_OUTPUT', true) ?? 1000) * 1,
      drain: (getBonusValue(world, components, holderID, 'HARVEST_DRAIN', true) ?? 1000) * 1,
      cooldown: 0,
    },
  };

  return bonuses;
};

export const getBonusValue = (
  world: World,
  components: Components,
  holderID: EntityID,
  type: string,
  percent?: boolean
): number => {
  const { BalanceSigned } = components;

  const entityIndex = getEntityIndex(world, holderID, type);
  if (!entityIndex) return percent ? 1000 : 0;

  const val =
    BigNumber.from(getComponentValue(BalanceSigned, entityIndex)?.value || 0)
      .fromTwos(256)
      .toNumber() || (0 as number);
  if (percent) return val <= -1000 ? 1 : 1000 + val;
  return val;
};

////////////////////
// UTILS

const getEntityIndex = (
  world: World,
  holderID: EntityID,
  field: string
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'string'],
    ['bonus', holderID ?? 0, field]
  );
  return world.entityToIndex.get(id as EntityID);
};
