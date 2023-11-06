import { EntityID } from "@mud-classic/recs";

export enum SyncState {
  CONNECTING,
  INITIAL,
  LIVE,
}

export const GodID = "0x060d" as EntityID;
