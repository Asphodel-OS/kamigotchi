import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { Components } from 'network/';
import { Allo, getAllo } from './Allo';
import { getEntityByHash, hashArgs, queryChildrenOf } from './utils';

export interface ScavBar {
  id: EntityID;
  field: string;
  index: number;
  cost: number;
  rewards: Allo[];
}

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
    rewards: queryChildrenOf(components, getRewardParentID(id)).map((rwdIndex: EntityIndex) =>
      getAllo(world, components, rwdIndex)
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
// IDs

const getRewardParentID = (regID: EntityID): EntityID => {
  return hashArgs(['scavenge.reward', regID], ['string', 'uint256'], true);
};

const getRegIndex = (world: World, field: string, index: number): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['registry.scavenge', field, index],
    ['string', 'string', 'uint32']
  );
};

const getInstanceID = (
  world: World,
  field: string,
  index: number,
  holderID: EntityID
): EntityIndex | undefined => {
  return getEntityByHash(
    world,
    ['scavenge.instance', field, index, holderID],
    ['string', 'string', 'uint32', 'uint256']
  );
};
