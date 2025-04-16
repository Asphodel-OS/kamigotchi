import { EntityID } from '@mud-classic/recs';
import { NetworkComponentUpdate, NetworkEvents } from 'workers/types';

export const EmptyNetworkEvent = {
  type: NetworkEvents.NetworkComponentUpdate,
  entity: '0' as EntityID,
  component: 'Void',
  value: undefined,
  blockNumber: 0,
  lastEventInTx: false,
  txHash: 'EmptyNetworkEvent',
  txMetadata: undefined,
} as NetworkComponentUpdate;
