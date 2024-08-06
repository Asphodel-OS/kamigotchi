import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { Reward, getReward } from './Rewards';
import { queryChildrenOf } from './utils';

export interface ScavBar {
  id: EntityID;
  field: string;
  index: number;
  cost: number;
  rewards: Reward[];
}

const IDStore = new Map<string, string>();

/////////////////
// FUNCTIONS

export const calcScavClaimable = (cost: number, points: number): number => {
  return Math.floor(points / cost);
};

/////////////////
// SHAPES

export const getScavBar = (
  world: World,
  components: Components,
  index: EntityIndex,
  scavField?: string,
  scavIndex?: number
): ScavBar => {
  const { Type, Index, Value } = components;
  const id = world.entities[index];

  return {
    id: id,
    field: scavField ?? (getComponentValue(Type, index)?.value as string),
    index: scavIndex ?? (getComponentValue(Index, index)?.value as number) * 1,
    cost: (getComponentValue(Value, index)?.value as number) * 1,
    rewards: queryChildrenOf(components, getRewardPointerID(id)).map((rwdIndex: EntityIndex) =>
      getReward(world, components, rwdIndex)
    ),
  };
};

/////////////////
// GETTERS

export const getScavBarFromHash = (
  world: World,
  components: Components,
  scavField: string,
  scavIndex: number
): ScavBar | undefined => {
  const id = getRegIndex(world, scavField, scavIndex);
  return id ? getScavBar(world, components, id, scavField, scavIndex) : undefined;
};

export const getScavPoints = (
  world: World,
  components: Components,
  scavField: string,
  scavIndex: number,
  holderID: EntityID
): number => {
  const { Value } = components;
  const id = getInstanceID(world, scavField, scavIndex, holderID);
  return id ? (getComponentValue(Value, id)?.value as number) * 1 : 0;
};

/////////////////
// UTILS

const getRewardPointerID = (regID: EntityID): EntityID => {
  let id = '';
  const key = 'scavenge.reward' + regID;
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(['string', 'uint256'], ['scavenge.reward', regID]);
    IDStore.set(key, id);
  }
  return id as EntityID; // ignore leading 0 pruning; for direct SC querying
};

const getRegIndex = (world: World, field: string, index: number): EntityIndex | undefined => {
  let id = '';
  const key = 'scavenge.reward' + field + index.toString();
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(['string', 'string', 'uint32'], ['registry.scavenge', field, index])
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};

const getInstanceID = (
  world: World,
  field: string,
  index: number,
  holderID: EntityID
): EntityIndex | undefined => {
  let id = '';
  const key = 'scavenge.instance' + field + index.toString() + holderID;
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(
        ['string', 'string', 'uint32', 'uint256'],
        ['scavenge.instance', field, index, holderID]
      )
    );
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};
