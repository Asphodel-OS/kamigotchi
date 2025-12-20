import { concatMap, from, Observable, of, retry, throwError, timeout, timer } from 'rxjs';

import { createKamigazeClient } from 'clients/kamigaze';
import { EmptyNetworkEvent } from 'constants/stream';
import { Decode } from 'engine/encoders';
import { NetworkEvent } from '../../types';
import { createFetchWorldEventsInBlockRange } from '../utils';
import { fetchGapEvents } from './gapfill';
import { createTransformWorldEvents, parseSystemCalls, TransformWorldEvents } from './transform';

export type FetchWorldEvents = ReturnType<typeof createFetchWorldEventsInBlockRange>;

export interface StreamOptions {
  url: string;
  worldAddress: string;
  decode: Decode;
  includeSystemCalls: boolean;
  fetchWorldEvents: FetchWorldEvents;
}

interface StreamTrackingState {
  expectedPrevLogIndex: number;
  expectedPrevLogBlock: number;
  isFirstMessage: boolean;
}

let currentBlock = 0;

/** Calculate Fibonacci delay in ms, capped at maxSeconds */
function getFibonacciDelay(attempt: number, maxSeconds: number = 10): number {
  let a = 1,
    b = 1;
  for (let i = 2; i < attempt; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  const seconds = Math.min(attempt <= 1 ? 1 : b, maxSeconds);
  return seconds * 1000;
}

/**
 * Create a resilient RxJS stream of NetworkEvents by subscribing to a gRPC streaming service.
 *
 * Features:
 * - Automatic timeout after 60s of no data
 * - Retry with exponential backoff (3 attempts)
 * - Gap-filling via RPC when blocks are missed
 * - System call parsing when enabled
 *
 * @param options Stream configuration options
 * @returns Observable that emits NetworkEvents
 */
export function createStream(options: StreamOptions): Observable<NetworkEvent> {
  const { url, worldAddress, decode, includeSystemCalls, fetchWorldEvents } = options;
  const transformWorldEvents = createTransformWorldEvents(decode);

  // Persist across retries
  const trackingState: StreamTrackingState = {
    expectedPrevLogIndex: -1,
    expectedPrevLogBlock: -1,
    isFirstMessage: true,
  };

  return createRawStream(
    url,
    worldAddress,
    decode,
    transformWorldEvents,
    includeSystemCalls,
    fetchWorldEvents,
    trackingState
  ).pipe(
    timeout({
      first: 10100,
      each: 10100, // KeepAlive message freq from the backend
      with: () =>
        throwError(() => {
          console.log('[kamigaze] Timeout - no data received for 10s');
          return new Error('Stream timeout - no data received for 10s');
        }),
    }),
    retry({
      delay: (error, retryCount) => {
        const delayMs = getFibonacciDelay(retryCount);
        console.log(
          `[kamigaze] Retrying stream subscription... attempt ${retryCount} (waiting ${delayMs / 1000}s)`
        );
        return timer(delayMs);
      },
    })
  );
}

/**
 * Create a raw RxJS stream of NetworkEvents without timeout/retry resilience.
 * Use createStream for production use.
 */
function createRawStream(
  url: string,
  worldAddress: string,
  decode: Decode,
  transformWorldEvents: TransformWorldEvents,
  includeSystemCalls: boolean,
  fetchWorldEvents: FetchWorldEvents,
  trackingState: StreamTrackingState
): Observable<NetworkEvent> {
  return new Observable((subscriber) => {
    const client = createKamigazeClient(url);

    const response = client.subscribeToStream({});
    console.log('[kamigaze] subscribeToStream');

    let gapToFill = false;

    from(response)
      .pipe(
        concatMap(async (responseChunk) => {
          let events = await transformWorldEvents(responseChunk);
          if (trackingState.isFirstMessage) {
            trackingState.isFirstMessage = false;
            console.log(
              `Stream started at block ${responseChunk.blockNumber}, logIndex ${responseChunk.logIndex}`
            );
          } else {
            // Verify the message's prevLogIndex/prevLogBlockNumber match what we expect
            if (responseChunk.prevLogBlockNumber !== trackingState.expectedPrevLogBlock) {
              console.warn(
                `Stream continuity warning: prevLogBlockNumber mismatch. Expected ${trackingState.expectedPrevLogBlock}, got ${responseChunk.prevLogBlockNumber}`
              );
              gapToFill = true;
            }
            if (responseChunk.prevLogIndex !== trackingState.expectedPrevLogIndex) {
              console.warn(
                `Stream continuity warning: prevLogIndex mismatch. Expected ${trackingState.expectedPrevLogIndex}, got ${responseChunk.prevLogIndex}`
              );
              gapToFill = true;
            }

            if (gapToFill) {
              console.warn(`Getting events since block ${trackingState.expectedPrevLogBlock}`);
              gapToFill = false;

              const gapEvents = await fetchGapEvents({
                kamigazeUrl: url,
                decode,
                fetchWorldEvents,
                fromBlock: trackingState.expectedPrevLogBlock,
                toBlock: responseChunk.blockNumber,
              });
              // Prepend gap events to current events
              events = [...gapEvents, ...events];
            }
          }
          // Update expected values for next message
          trackingState.expectedPrevLogIndex = responseChunk.logIndex;
          trackingState.expectedPrevLogBlock = responseChunk.blockNumber;

          if (events.length === 0) return [EmptyNetworkEvent];

          if (includeSystemCalls && events.length > 0) {
            const systemCalls = parseSystemCalls(events);
            return [...events, ...systemCalls];
          }

          return events;
        }),
        concatMap((v) => of(...v))
      )
      .subscribe(subscriber);

    return () => {
      console.log('[kamigaze] Cleaning up stream subscription');
    };
  });
}
