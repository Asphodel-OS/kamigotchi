import { EntityID } from '@mud-classic/recs';

export interface Commit {
  id: EntityID;
  revealBlock: number;
}

export const filterRevealable = <T extends Commit>(commits: T[], currBlock: number): T[] => {
  return commits.filter((commit) => canReveal(commit, currBlock));
};

export const canReveal = (commit: Commit, currBlock: number): boolean => {
  // although commits are valid for 256 blocks, set to 250 for a small buffer
  return commit.revealBlock + 250 > currBlock;
};
