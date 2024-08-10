import { DTCommit } from 'network/shapes/Droptable';

export interface CommitData extends DTCommit {
  failures: number; // used to filter out bad commits
}
