import { Result } from '@ethersproject/abi';
import { Components, ComponentValue, EntityID, SchemaOf } from '@mud-classic/recs';
import { BigNumber, ContractInterface } from 'ethers';

import { ProviderConfig } from 'engine/providers';
import { Contracts } from 'engine/types';
import { TxMetadata } from 'engine/types/ecs-stream/ecs-stream';

export type ContractConfig = {
  address: string;
  abi: ContractInterface;
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
  value: BigNumber;
};

export type SystemCall<C extends Components = Components> = {
  type: NetworkEvents.SystemCall;
  tx: SystemCallTransaction;
  updates: NetworkComponentUpdate<C>[];
};

export enum NetworkEvents {
  SystemCall = 'SystemCall',
  NetworkComponentUpdate = 'NetworkComponentUpdate',
}

export type NetworkEvent<C extends Components = Components> =
  | NetworkComponentUpdate<C>
  | SystemCall<C>;

export function isSystemCallEvent<C extends Components>(e: NetworkEvent<C>): e is SystemCall<C> {
  return e.type === NetworkEvents.SystemCall;
}

export function isNetworkComponentUpdateEvent<C extends Components>(
  e: NetworkEvent<C>
): e is NetworkComponentUpdate<C> {
  return e.type === NetworkEvents.NetworkComponentUpdate;
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
