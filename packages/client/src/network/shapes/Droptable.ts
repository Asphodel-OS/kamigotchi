import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';
import { getItemDetailsByIndex } from './Item';
import { Commit, DetailedEntity } from './utils';
import { queryHolderCommits } from './utils/commits';

export interface Droptable {
  keys: number[];
  weights: number[];
}

export interface DTResult {
  amount: number;
  rarity: number;
  object: DetailedEntity;
}

export interface DTLog {
  id: EntityID;
  results: DTResult[];
}

export const NullDTLog: DTLog = {
  id: '0' as EntityID,
  results: [],
};

const IDStore = new Map<string, string>();

export const getDroptable = (components: Components, index: EntityIndex): Droptable => {
  const { Keys, Weights } = components;
  return {
    keys: getComponentValue(Keys, index)?.value as number[],
    weights: getComponentValue(Weights, index)?.value as number[],
  };
};

export const getDTLogByHash = (
  world: World,
  components: Components,
  holderID: EntityID,
  dtID: EntityID
): DTLog => {
  const entityIndex = getLogEntityIndex(world, holderID, dtID);
  if (!entityIndex) return NullDTLog;

  const { Values } = components;
  const amounts = getComponentValue(Values, entityIndex)?.value as number[] | [];

  const droptable = getDroptable(components, world.entityToIndex.get(dtID) as EntityIndex);

  return {
    id: world.entities[entityIndex],
    results: getDTResults(world, components, droptable, amounts),
  };
};

export const getDTResults = (
  world: World,
  components: Components,
  droptable: Droptable,
  amounts: number[]
): DTResult[] => {
  const results: DTResult[] = [];
  for (let i = 0; i < droptable.keys.length; i++) {
    if (amounts[i] > 0) {
      const rarity = droptable.weights[i];
      const object = getItemDetailsByIndex(world, components, droptable.keys[i]);
      results.push({ amount: amounts[i], rarity, object });
    }
  }
  return results;
};

export const queryDTCommits = (
  world: World,
  components: Components,
  holderID: EntityID
): Commit[] => {
  return queryHolderCommits(world, components, 'ITEM_DROPTABLE_COMMIT', holderID);
};

const getLogEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  dtID: EntityID | undefined
): EntityIndex | undefined => {
  if (!holderID) return;
  let id = '';
  const key = 'droptable.item.log' + holderID + dtID;

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = formatEntityID(
      utils.solidityKeccak256(
        ['string', 'uint256', 'uint256'],
        ['droptable.item.log', holderID, dtID]
      )
    );
  }
  return world.entityToIndex.get(id);
};
