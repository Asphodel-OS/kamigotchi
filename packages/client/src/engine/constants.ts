import { EntityID } from '@mud-classic/recs';

export const GodID = '0x060d' as EntityID;

export enum SyncState {
  CONNECTING,
  SETUP,
  BACKFILL,
  GAPFILL,
  INITIALIZE,
  LIVE,
  FAILED,
}

export type SyncStatus = {
  state: SyncState;
  msg: string;
  percentage: number;
};
