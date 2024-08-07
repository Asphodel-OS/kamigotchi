export enum CommitState {
  Requested,
  Executing,
  Complete,
  Failed,
}

export const CommitStateString = {
  [CommitState.Requested]: 'Requested',
  [CommitState.Executing]: 'Executing',
  [CommitState.Complete]: 'Complete',
  [CommitState.Failed]: 'Failed',
};
