import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { getRarities } from 'constants/rarities';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Commit, getHolderCommits } from './Commit';
import { getItemDetailsByIndex } from './Item';
import { DetailedEntity, getEntityByHash } from './utils';
import { getKeys, getWeights } from './utils/component';

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

export const getDroptable = (components: Components, entity: EntityIndex): Droptable => {
  return {
    keys: getKeys(components, entity),
    weights: getWeights(components, entity),
  };
};

export const getDTLogByHash = (
  world: World,
  components: Components,
  holderID: EntityID,
  dtID: EntityID
): DTLog => {
  const entity = getLogEntityIndex(world, holderID, dtID);
  if (!entity) return NullDTLog;

  const { Values } = components;
  const amounts = getComponentValue(Values, entity)?.value as number[] | [];

  const droptable = getDroptable(components, world.entityToIndex.get(dtID) as EntityIndex);

  return {
    id: world.entities[entity],
    results: getDTResults(world, components, droptable, amounts),
  };
};

// returns in a gronkable item format
export const getDTDetails = (
  world: World,
  components: Components,
  droptable: Droptable
): DetailedEntity[] => {
  const details: DetailedEntity[] = [];
  for (let i = 0; i < droptable.keys.length; i++)
    details.push({
      ...getItemDetailsByIndex(world, components, droptable.keys[i]),
      description: getRarities(droptable.weights[i]).title,
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
  const { SourceID, Value } = components;

  const commits = getHolderCommits(world, components, 'ITEM_DROPTABLE_COMMIT', holderID);
  return commits.map((commit) => {
    return {
      ...commit,
      parentID: formatEntityID((getComponentValue(SourceID, commit.entity)?.value || 0).toString()),
      rolls: (getComponentValue(Value, commit.entity)?.value as number) * 1,
    };
  });
};

//////////////////
// IDs

const getLogEntityIndex = (
  world: any,
  holderID: EntityID | undefined,
  dtID: EntityID | undefined
): EntityIndex | undefined => {
  if (!holderID) return;
  return getEntityByHash(
    world,
    ['droptable.item.log', holderID, dtID],
    ['string', 'uint256', 'uint256']
  );
};
