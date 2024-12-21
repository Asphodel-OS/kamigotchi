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
  entity: EntityIndex;
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
  // indefinite blockhash availability from block 979550 onwards
  return commit.revealBlock > 0;
};

/////////////////
// SHAPES

export const getCommit = (
  world: World,
  components: Components,
  entity: EntityIndex,
  holderID?: EntityID
): Commit => {
  const { HolderID, RevealBlock, Type } = components;

  return {
    id: world.entities[entity],
    entity,
    revealBlock: (getComponentValue(RevealBlock, entity)?.value as number) * 1,
    holder: holderID ?? formatEntityID(getComponentValue(HolderID, entity)?.value ?? ''),
    type: getComponentValue(Type, entity)?.value as string,
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
  return raw.map((entity): Commit => getCommit(world, components, entity, holderID));
};
