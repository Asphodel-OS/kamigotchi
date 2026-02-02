import { DTCommit } from 'network/shapes/Droptable';

export type RevealType = 'droptable' | 'sacrifice';

export interface CommitData extends DTCommit {
  failures: number; // used to filter out bad commits
  revealType: RevealType;
}
