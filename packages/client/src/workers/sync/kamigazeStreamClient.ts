import { grpc } from '@improbable-eng/grpc-web';
import { awaitPromise } from '@mud-classic/utils';
import { BigNumber } from 'ethers';
import { createChannel, createClient } from 'nice-grpc-web';
import { Observable, concatMap, from, map, of } from 'rxjs';

import {
  KamigazeServiceClient,
  KamigazeServiceDefinition,
  StreamResponse,
} from 'engine/types/kamigaze/kamigaze';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { debug as parentDebug } from '../debug';
import {
  NetworkComponentUpdate,
  NetworkEvent,
  NetworkEvents,
  SystemCall,
  SystemCallTransaction,
} from '../types';
import { createDecode, groupByTxHash } from './utils';

const debug = parentDebug.extend('syncUtils');

export function createKamigazeStreamClient(url: string): KamigazeServiceClient {
  return createClient(KamigazeServiceDefinition, createChannel(url, grpc.WebsocketTransport()));
}

/**
 * Create a RxJS stream of {@link NetworkComponentUpdate}s by subscribing to a
 * gRPC streaming service.
 *
 * @param streamServiceUrl URL of the gPRC stream service to subscribe to.
 * @param worldAddress Contract address of the World contract to subscribe to.
 * @param transformWorldEvents Function to transform World events from a stream service ({@link createTransformWorldEventsFromStream}).
 * @returns Stream of {@link NetworkComponentUpdate}s.
 */
export function createKamigazeStreamService(
  streamServiceUrl: string,
  worldAddress: string,
  transformWorldEvents: ReturnType<typeof createTransformWorldEventsFromStream>,
  includeSystemCalls: boolean
): Observable<NetworkEvent> {
  const streamServiceClient = createKamigazeStreamClient(streamServiceUrl);
  const response = streamServiceClient.subscribeToStream({
    worldAddress,
    blockNumber: true,
    blockHash: true,
    blockTimestamp: true,
    transactionsConfirmed: false, // do not need txs since each ECSEvent contains the hash
    ecsEvents: true,
    ecsEventsIncludeTxMetadata: includeSystemCalls,
  });
  // Turn stream responses into rxjs NetworkEvent
  return from(response).pipe(
    map(async (responseChunk) => {
      const events = await transformWorldEvents(responseChunk);
      debug(`got ${events.length} events from block ${responseChunk.blockNumber}`);
      if (includeSystemCalls && events.length > 0) {
        const systemCalls = parseSystemCallsFromStreamEvents(events);
        return [...events, ...systemCalls];
      }

      return events;
    }),
    awaitPromise(),
    concatMap((v) => of(...v))
  );
}

/**
 * Create a function to transform World contract events from a stream service response chunk.
 * @param decode Function to decode raw component values ({@link createDecode})
 * @returns Function to transform World contract events from a stream service.
 */
export function createTransformWorldEventsFromStream(decode: ReturnType<typeof createDecode>) {
  return async (message: StreamResponse) => {
    const { blockNumber, ecsEvents } = message;

    const convertedEcsEvents: NetworkComponentUpdate[] = [];

    for (let i = 0; i < ecsEvents.length; i++) {
      const ecsEvent = ecsEvents[i]!;

      const rawComponentId = ecsEvent.componentId;
      const entityId = ecsEvent.entityId;
      const txHash = ecsEvent.txHash;

      const component = formatComponentID(rawComponentId);
      const entity = formatEntityID(entityId);

      const value =
        ecsEvent.eventType === 'ComponentValueSet'
          ? await decode(component, ecsEvent.value)
          : undefined;

      // Since ECS events are coming in ordered over the wire, we check if the following event has a
      // different transaction then the current, which would mean an event associated with another
      // tx
      const lastEventInTx = ecsEvents[i + 1]?.txHash !== ecsEvent.txHash;

      convertedEcsEvents.push({
        type: NetworkEvents.NetworkComponentUpdate,
        component,
        entity,
        value,
        blockNumber,
        lastEventInTx,
        txHash,
        txMetadata: ecsEvent.txMetadata,
      });
    }

    return convertedEcsEvents;
  };
}

export function parseSystemCallsFromStreamEvents(events: NetworkComponentUpdate[]) {
  const systemCalls: SystemCall[] = [];
  const transactionHashToEvents = groupByTxHash(events);

  for (const txHash of Object.keys(transactionHashToEvents)) {
    // All ECS events include the information needed to parse the SysytemCallTransasction out, so it doesn't
    // matter which one we take here.
    const tx = parseSystemCallTransactionFromStreamNetworkComponentUpdate(
      transactionHashToEvents[txHash]![0]!
    );
    if (!tx) continue;

    systemCalls.push({
      type: NetworkEvents.SystemCall,
      tx,
      updates: transactionHashToEvents[tx.hash]!,
    });
  }

  return systemCalls;
}

function parseSystemCallTransactionFromStreamNetworkComponentUpdate(event: NetworkComponentUpdate) {
  if (!event.txMetadata) return null;

  const { to, data, value } = event.txMetadata;

  return {
    to,
    data: BigNumber.from(data).toHexString(),
    value: BigNumber.from(value),
    hash: event.txHash,
  } as SystemCallTransaction;
}
