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

export interface DTCommit extends Commit {
  parentID: EntityID;
  rolls: number;
}

export interface DTDetails {
  rarity: number;
  object: DetailedEntity;
}

export interface DTResult extends DTDetails {
  amount: number;
}

export interface DTLog {
  id: EntityID;
  results: DTResult[];
}

export const NullDT: Droptable = {
  keys: [],
  weights: [],
};

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

// returns in a gronkable item format
export const getDTDetails = (
  world: World,
  components: Components,
  droptable: Droptable
): DTDetails[] => {
  const details: DTDetails[] = [];
  for (let i = 0; i < droptable.keys.length; i++)
    details.push({
      rarity: droptable.weights[i],
      object: getItemDetailsByIndex(world, components, droptable.keys[i]),
    });
  return details;
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
      results.push({ amount: amounts[i] * 1, rarity, object });
    }
  }
  return results;
};

export const queryDTCommits = (
  world: World,
  components: Components,
  holderID: EntityID
): DTCommit[] => {
  const { For, Value } = components;

  const commits = queryHolderCommits(world, components, 'ITEM_DROPTABLE_COMMIT', holderID);
  return commits.map((commit) => {
    return {
      ...commit,
      parentID: formatEntityID((getComponentValue(For, commit.entityIndex)?.value || 0).toString()),
      rolls: (getComponentValue(Value, commit.entityIndex)?.value as number) * 1,
    };
  });
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
