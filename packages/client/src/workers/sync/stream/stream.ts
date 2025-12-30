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
  onMessage?: () => void;
}

interface StreamTrackingState {
  expectedPrevLogIndex: number;
  expectedPrevLogBlock: number;
  isFirstMessage: boolean;
  proactiveInFlight: boolean;
  isWakeReconnect: boolean;
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
    onMessage,
  } = options;
  const transformWorldEvents = createTransformWorldEvents(decode);

  // Persist across retries
  const trackingState: StreamTrackingState = {
    expectedPrevLogIndex: -1,
    expectedPrevLogBlock: -1,
    isFirstMessage: true,
    proactiveInFlight: false,
    isWakeReconnect: false,
  };

  return new Observable<NetworkEvent>((subscriber) => {
    // Subscribe to wake signal to trigger immediate reconnection
    const wakeSub = wakeSignal$?.subscribe(() => {
      console.log('[kamigaze] Wake signal received, forcing reconnection');
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
              console.log(
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
          console.log('[kamigaze] Immediate retry due to wake signal');
          trackingState.isWakeReconnect = true;
          return timer(0);
        }

        trackingState.isWakeReconnect = false;
        const delayMs = getRetryDelay(retryCount);
        console.log(
          `[kamigaze] Retrying stream subscription... attempt ${retryCount} (waiting ${delayMs / 1000}s)`
        );

        // Listen for wake signal during delay - if received, retry immediately
        if (wakeSignal$) {
          return race(
            timer(delayMs),
            wakeSignal$.pipe(
              take(1),
              tap(() => {
                console.log('[kamigaze] Wake signal during retry delay, retrying immediately');
                trackingState.isWakeReconnect = true;
              }),
              switchMap(() => timer(0))
            )
          );
        }

        return timer(delayMs);
      },
    })
  );
}

/**
 * Proactive gap-fill: fetch and emit events immediately on reconnect.
 * Runs in parallel with stream subscription for faster recovery.
 */
function startProactiveGapFill(
  subscriber: { next: (e: NetworkEvent) => void },
  url: string,
  decode: Decode,
  fetchWorldEvents: FetchWorldEvents,
  fromBlock: number,
  trackingState: StreamTrackingState
): void {
  console.log(`[kamigaze] Proactive gap-fill from block ${fromBlock}`);
  trackingState.proactiveInFlight = true;
  fetchGapEvents({
    kamigazeUrl: url,
    decode,
    fetchWorldEvents,
    fromBlock,
    skipRpcFallback: true,
  })
    .then((gapEvents) => {
      console.log(`[kamigaze] Emitting ${gapEvents.length} gap events immediately`);
      gapEvents.forEach((e) => subscriber.next(e));
    })
    .catch((err) => {
      console.warn('[kamigaze] Proactive gap-fill failed:', err);
    })
    .finally(() => {
      trackingState.proactiveInFlight = false;
    });
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
    console.log('[kamigaze] subscribeToStream', {
      isWakeReconnect: trackingState.isWakeReconnect,
      expectedPrevLogBlock: trackingState.expectedPrevLogBlock,
      proactiveInFlight: trackingState.proactiveInFlight,
    });
    // Proactive gap-fill only on wake reconnect (skip if already in-flight)
    let proactiveGapFill = trackingState.proactiveInFlight;
    if (trackingState.proactiveInFlight) {
      console.log('[kamigaze] Skipping proactive gap-fill (already in-flight)');
    } else if (!trackingState.isWakeReconnect) {
      console.log('[kamigaze] Skipping proactive gap-fill (not a wake reconnect)');
    } else if (trackingState.expectedPrevLogBlock > 0) {
      proactiveGapFill = true;
      startProactiveGapFill(
        subscriber,
        url,
        decode,
        fetchWorldEvents,
        trackingState.expectedPrevLogBlock,
        trackingState
      );
    }

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

            if (gapToFill && !proactiveGapFill) {
              console.warn(`Getting events since block ${trackingState.expectedPrevLogBlock}`);
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
          proactiveGapFill = false;
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
