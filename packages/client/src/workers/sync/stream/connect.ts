import { awaitPromise } from '@mud-classic/utils';
import { BigNumber } from 'ethers';
import { concatMap, from, map, Observable, of } from 'rxjs';

import { EntityID } from '@mud-classic/recs';
import { debug as parentDebug } from '../../debug';
import {
  NetworkComponentUpdate,
  NetworkEvent,
  NetworkEvents,
  SystemCall,
  SystemCallTransaction,
} from '../../types';
import { groupByTxHash } from '../utils';
import { create } from './create';
import { TransformWorldEvents } from './utils';

const debug = parentDebug.extend('syncUtils');

/**
 * Create a RxJS stream of {@link NetworkComponentUpdate}s by subscribing to a
 * gRPC streaming service.
 *
 * @param streamServiceUrl URL of the gPRC stream service to subscribe to.
 * @param worldAddress Contract address of the World contract to subscribe to.
 * @param transformWorldEvents Function to transform World events from a stream service ({@link createTransformWorldEvents}).
 * @returns Stream of {@link NetworkComponentUpdate}s.
 */
export function connect(
  streamServiceUrl: string,
  worldAddress: string,
  transformWorldEvents: TransformWorldEvents,
  includeSystemCalls: boolean
): Observable<NetworkEvent> {
  return new Observable((subscriber) => {
    const streamServiceClient = create(streamServiceUrl);

    const response = streamServiceClient.subscribeToStream({
      worldAddress,
      blockNumber: true,
      blockHash: true,
      blockTimestamp: true,
      transactionsConfirmed: false, // do not need txs since each ECSEvent contains the hash
      ecsEvents: true,
      ecsEventsIncludeTxMetadata: includeSystemCalls,
    });
    console.log('[kamigaze] streamServiceClient.subscribeToStream');

    // Turn stream responses into rxjs NetworkEvent
    from(response)
      .pipe(
        map(async (responseChunk) => {
          debug('[kamigaze] got events');
          const events = await transformWorldEvents(responseChunk);
          if (events.length === 0) {
            return [
              {
                type: NetworkEvents.NetworkComponentUpdate,
                entity: '0' as EntityID,
                component: 'KeepAlive',
                value: undefined,
                blockNumber: 0,
                lastEventInTx: false,
                txHash: 'KeepAlive',
                txMetadata: undefined,
              } as NetworkComponentUpdate,
            ];
          }
          if (includeSystemCalls && events.length > 0) {
            const systemCalls = parseSystemCalls(events);
            return [...events, ...systemCalls];
          }
          return events;
        }),
        awaitPromise(),
        concatMap((v) => of(...v))
      )
      .subscribe(subscriber);

    // Add channel cleanup to the subscription cleanup
    return () => {
      debug('[kamigaze] Cleaning up stream subscription');
    };
  });
}

// parses SystemCalls from a list of NetworkComponentUpdates
const parseSystemCalls = (events: NetworkComponentUpdate[]): SystemCall[] => {
  const systemCalls: SystemCall[] = [];
  const transactionHashToEvents = groupByTxHash(events);

  for (const txHash of Object.keys(transactionHashToEvents)) {
    // All ECS events include the information needed to parse the SysytemCallTransasction out, so it doesn't
    // matter which one we take here.
    const tx = parseSystemCall(transactionHashToEvents[txHash]![0]!);
    if (!tx) continue;

    systemCalls.push({
      type: NetworkEvents.SystemCall,
      tx,
      updates: transactionHashToEvents[tx.hash]!,
    });
  }

  return systemCalls;
};

// parses a SystemCallTransaction from a NetworkComponentUpdate
const parseSystemCall = (event: NetworkComponentUpdate) => {
  if (!event.txMetadata) return null;
  const { to, data, value } = event.txMetadata;
  return {
    to,
    data: BigNumber.from(data).toHexString(),
    value: BigNumber.from(value),
    hash: event.txHash,
  } as SystemCallTransaction;
};
