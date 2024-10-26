import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';

export interface Commit {
  id: EntityID;
  entityIndex: EntityIndex;
  revealBlock: number;
  holder: EntityID;
  type: string;
}

/////////////////
// FUNCTIONS

export const filterRevealable = <T extends Commit>(commits: T[], currBlock: number): T[] => {
  return commits.filter((commit) => canReveal(commit, currBlock));
};

export const canReveal = (commit: Commit, currBlock: number | BigInt): boolean => {
  // return commit.revealBlock + 250 > Number(currBlock);
  return true; // blockhash doesnt expire
};

/////////////////
// SHAPES

export const getCommit = (
  world: World,
  components: Components,
  index: EntityIndex,
  holderID?: EntityID
): Commit => {
  const { HolderID, RevealBlock, Type } = components;

  return {
    id: world.entities[index],
    entityIndex: index,
    revealBlock: (getComponentValue(RevealBlock, index)?.value as number) * 1,
    holder: holderID ?? formatEntityID(getComponentValue(HolderID, index)?.value ?? ''),
    type: getComponentValue(Type, index)?.value as string,
  };
};

//////////////////
// QUERIES

export const queryHolderCommits = (
  world: World,
  components: Components,
  field: string,
  holderID: EntityID
): Commit[] => {
  const { HolderID, Type, RevealBlock } = components;

  const toQuery: QueryFragment[] = [
    HasValue(HolderID, { value: holderID }),
    HasValue(Type, { value: field }),
    Has(RevealBlock),
  ];

  const raw = Array.from(runQuery(toQuery)).reverse(); // reversed for descending time order
  return raw.map((index): Commit => getCommit(world, components, index, holderID));
};
