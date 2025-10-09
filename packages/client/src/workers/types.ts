import { Components, ComponentValue, EntityID, SchemaOf } from 'engine/recs';
import { Interface, Result } from 'ethers';

import { ProviderConfig } from 'engine/providers';
import { Contracts } from 'engine/types';
import { TxMetadata } from 'engine/types/ecs-stream/ecs-stream';

export type ContractConfig = {
  address: string;
  abi: Interface;
};

export type ContractsConfig<C extends Contracts> = {
  [key in keyof C]: ContractConfig;
};

export type ContractEvent<C extends Contracts> = {
  contractKey: keyof C;
  eventKey: string;
  args: Result;
  txHash: string;
  lastEventInTx: boolean;
};

export type NetworkComponentUpdate<C extends Components = Components> = {
  [key in keyof C]: {
    type: NetworkEvents.NetworkComponentUpdate;
    component: key & string;
    value: ComponentValue<SchemaOf<C[key]>> | undefined;
  };
}[keyof C] & {
  entity: EntityID;
  lastEventInTx: boolean;
  txHash: string;
  txMetadata?: TxMetadata;
  blockNumber: number;
};

export type SystemCallTransaction = {
  hash: string;
  to: string;
  data: string;
  value: bigint;
};

export type SystemCall<C extends Components = Components> = {
  type: NetworkEvents.SystemCall;
  tx: SystemCallTransaction;
  updates: NetworkComponentUpdate<C>[];
};

export type SerializedPerformanceEntry = {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
};

export type TimingData = {
  type: NetworkEvents.TimingData;
  measures: SerializedPerformanceEntry[];
  marks: SerializedPerformanceEntry[];
};

export enum NetworkEvents {
  SystemCall = 'SystemCall',
  NetworkComponentUpdate = 'NetworkComponentUpdate',
  TimingData = 'TimingData',
}

export type NetworkEvent<C extends Components = Components> =
  | NetworkComponentUpdate<C>
  | SystemCall<C>
  | TimingData;

export function isSystemCallEvent<C extends Components>(e: NetworkEvent<C>): e is SystemCall<C> {
  return e.type === NetworkEvents.SystemCall;
}

export function isNetworkComponentUpdateEvent<C extends Components>(
  e: NetworkEvent<C>
): e is NetworkComponentUpdate<C> {
  return e.type === NetworkEvents.NetworkComponentUpdate;
}

export function isTimingDataEvent(e: NetworkEvent): e is TimingData {
  return e.type === NetworkEvents.TimingData;
}

export type SyncWorkerConfig = {
  provider: ProviderConfig;
  worldContract: ContractConfig;
  disableCache?: boolean;
  chainId: number;
  snapshotServiceUrl?: string;
  streamServiceUrl?: string;
  fetchSystemCalls?: boolean;
  snapshotNumChunks?: number;
  pruneOptions?: { playerAddress: string; hashedComponentId: string };
};
