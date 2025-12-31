import {
  concatMap,
  from,
  Observable,
  of,
  race,
  retry,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
  timeout,
  timer,
} from 'rxjs';

import { createKamigazeClient } from 'clients/kamigaze';
import { EmptyNetworkEvent } from 'constants/stream';
import { Decode } from 'engine/encoders';
import { log } from 'utils/logger';
import { NetworkEvent } from '../../types';
import { createFetchWorldEventsInBlockRange } from '../utils';
import { fetchGapEvents } from './gapfill';
import { createTransformWorldEvents, parseSystemCalls, TransformWorldEvents } from './transform';

export type FetchWorldEvents = ReturnType<typeof createFetchWorldEventsInBlockRange>;

/** Backend sends keepalive messages at this interval (ms) */
export const KEEPALIVE_INTERVAL_MS = 10000;

/** Buffer added to keepalive interval for stream timeout (ms) */
export const STREAM_TIMEOUT_BUFFER_MS = 500;

/** Buffer added to keepalive interval for health check threshold (ms) */
export const HEALTH_CHECK_BUFFER_MS = 2000;

export interface StreamOptions {
  url: string;
  worldAddress: string;
  decode: Decode;
  includeSystemCalls: boolean;
  fetchWorldEvents: FetchWorldEvents;
  wakeSignal$?: Subject<void>;
  blockUpdate$?: Subject<number>;
  onMessage?: () => void;
}

interface StreamTrackingState {
  expectedPrevLogIndex: number;
  expectedPrevLogBlock: number;
  isFirstMessage: boolean;
}

/** Fixed retry delays in seconds, capped at last value */
const RETRY_DELAYS_SECONDS = [1, 2, 3, 5, 10];

function getRetryDelay(retryCount: number): number {
  const index = Math.min(retryCount, RETRY_DELAYS_SECONDS.length - 1);
  return RETRY_DELAYS_SECONDS[index] * 1000;
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
  const {
    url,
    worldAddress,
    decode,
    includeSystemCalls,
    fetchWorldEvents,
    wakeSignal$,
    blockUpdate$,
    onMessage,
  } = options;
  const transformWorldEvents = createTransformWorldEvents(decode);

  // Persist across retries
  const trackingState: StreamTrackingState = {
    expectedPrevLogIndex: -1,
    expectedPrevLogBlock: -1,
    isFirstMessage: true,
  };

  // Update tracking state from main thread gapfill
  blockUpdate$?.subscribe((blockNumber) => {
    if (blockNumber > trackingState.expectedPrevLogBlock) {
      log.debug(`[kamigaze] Block update from main thread: ${blockNumber}`);
      trackingState.expectedPrevLogBlock = blockNumber;
    }
  });

  return new Observable<NetworkEvent>((subscriber) => {
    // Subscribe to wake signal to trigger immediate reconnection
    const wakeSub = wakeSignal$?.subscribe(() => {
      log.debug('[kamigaze] Wake signal received, forcing reconnection');
      subscriber.error(new Error('Wake signal - forcing reconnection'));
    });

    const innerSub = createRawStream(
      url,
      worldAddress,
      decode,
      transformWorldEvents,
      includeSystemCalls,
      fetchWorldEvents,
      trackingState
    )
      .pipe(
        tap(() => onMessage?.()),
        timeout({
          first: KEEPALIVE_INTERVAL_MS + STREAM_TIMEOUT_BUFFER_MS,
          each: KEEPALIVE_INTERVAL_MS + STREAM_TIMEOUT_BUFFER_MS,
          with: () =>
            throwError(() => {
              log.debug(
                `[kamigaze] Timeout - no data received for ${KEEPALIVE_INTERVAL_MS / 1000}s`
              );
              return new Error(
                `Stream timeout - no data received for ${KEEPALIVE_INTERVAL_MS / 1000}s`
              );
            }),
        })
      )
      .subscribe({
        next: (v) => subscriber.next(v),
        error: (e) => subscriber.error(e),
        complete: () => subscriber.complete(),
      });

    return () => {
      wakeSub?.unsubscribe();
      innerSub.unsubscribe();
    };
  }).pipe(
    retry({
      delay: (error, retryCount) => {
        // Immediate retry on wake signal
        if (error.message?.includes('Wake signal')) {
          log.debug('[kamigaze] Immediate retry due to wake signal');
          return timer(0);
        }

        const delayMs = getRetryDelay(retryCount);
        log.debug(
          `[kamigaze] Retrying stream subscription... attempt ${retryCount} (waiting ${delayMs / 1000}s)`
        );

        // Race between normal delay and wake signal - whichever emits first wins.
        // This catches wake signals that arrive during retry delay (when wakeSub is unsubscribed).
        if (wakeSignal$) {
          return race(
            timer(delayMs), // Normal retry delay
            wakeSignal$.pipe(
              take(1), // Only react to first wake signal
              tap(() => {
                log.debug('[kamigaze] Wake signal during retry delay, retrying immediately');
              }),
              switchMap(() => timer(0)) // Emit immediately to trigger retry
            )
          );
        }

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
    log.debug('[kamigaze] subscribeToStream', {
      expectedPrevLogBlock: trackingState.expectedPrevLogBlock,
    });

    let gapToFill = false;

    from(response)
      .pipe(
        concatMap(async (responseChunk) => {
          let events = await transformWorldEvents(responseChunk);

          if (trackingState.isFirstMessage) {
            trackingState.isFirstMessage = false;
            log.debug(
              `Stream started at block ${responseChunk.blockNumber}, logIndex ${responseChunk.logIndex}`
            );
          } else {
            if (responseChunk.prevLogBlockNumber !== trackingState.expectedPrevLogBlock) {
              log.warn(
                `Stream continuity warning: prevLogBlockNumber mismatch. Expected ${trackingState.expectedPrevLogBlock}, got ${responseChunk.prevLogBlockNumber}`
              );
              gapToFill = true;
            }
            if (responseChunk.prevLogIndex !== trackingState.expectedPrevLogIndex) {
              log.warn(
                `Stream continuity warning: prevLogIndex mismatch. Expected ${trackingState.expectedPrevLogIndex}, got ${responseChunk.prevLogIndex}`
              );
              gapToFill = true;
            }

            if (gapToFill) {
              log.warn(`Getting events since block ${trackingState.expectedPrevLogBlock}`);
              gapToFill = false;

              const gapEvents = await fetchGapEvents({
                kamigazeUrl: url,
                decode,
                fetchWorldEvents,
                fromBlock: trackingState.expectedPrevLogBlock,
                toBlock: responseChunk.blockNumber,
              });
              events = [...gapEvents, ...events];
            }
          }

          trackingState.expectedPrevLogIndex = responseChunk.logIndex;
          trackingState.expectedPrevLogBlock = responseChunk.blockNumber;
          gapToFill = false;

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

    return () => {};
  });
}
