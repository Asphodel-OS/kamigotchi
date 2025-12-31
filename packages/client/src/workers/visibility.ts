import { Subject, Subscription } from 'rxjs';

import { getKamigazeClient } from 'clients/kamigaze';
import { createDecode } from 'engine/encoders';
import { Components } from 'engine/recs';
import { log } from 'utils/logger';

import { createBlockUpdate, createWake, Input } from './sync/Worker';
import { parseGetEventsSinceResponse } from './sync/stream/gapfill';
import { HEALTH_CHECK_BUFFER_MS, KEEPALIVE_INTERVAL_MS } from './sync/stream/stream';
import { NetworkEvent } from './types';

const WAKE_DEBOUNCE_MS = 1000;
const HEALTH_THRESHOLD_MS = KEEPALIVE_INTERVAL_MS + HEALTH_CHECK_BUFFER_MS;

export interface VisibilityHandlerOptions<C extends Components> {
  input$: Subject<Input>;
  ecsEvents$: Subject<NetworkEvent<C>[]>;
}

export interface VisibilityHandler {
  dispose: () => void;
}

/**
 * Creates a visibility change handler that:
 * 1. Sends wake signals to the worker when the app becomes visible
 * 2. Fetches gap events from Kamigaze on the main thread
 * 3. Tracks the latest block number from incoming events
 */
export function createVisibilityHandler<C extends Components>(
  options: VisibilityHandlerOptions<C>
): VisibilityHandler {
  const { input$, ecsEvents$ } = options;

  let lastWakeSignal = 0;
  let lastKnownBlock = 0;
  let lastEventTime = 0;
  const decode = createDecode();

  const handleVisibilityChange = async () => {
    if (document.visibilityState !== 'visible') return;

    const now = Date.now();
    if (now - lastWakeSignal < WAKE_DEBOUNCE_MS) {
      log.debug('[Visibility] Wake signal debounced');
      return;
    }

    lastWakeSignal = now;
    log.debug('[Visibility] App became visible, sending wake signal');
    input$.next(createWake());

    // Skip gapfill if stream is healthy
    const timeSinceLastEvent = now - lastEventTime;
    if (timeSinceLastEvent < HEALTH_THRESHOLD_MS) {
      log.debug(
        `[Visibility] Stream healthy (last event ${timeSinceLastEvent}ms ago), skipping main-thread gapfill`
      );
      return;
    }

    // Fetch events since last known block from main thread
    const client = getKamigazeClient();
    if (client && lastKnownBlock > 0) {
      log.debug(
        `[Visibility] Stream appears stale (${timeSinceLastEvent}ms since last event), fetching gap from block ${lastKnownBlock}`
      );
      try {
        const response = await client.getEventsSince({ sinceBlock: lastKnownBlock });
        log.debug(`[Visibility] Got ${response.events.length} gap events from main thread`);
        const events = await parseGetEventsSinceResponse(
          response,
          decode,
          lastKnownBlock,
          '[Visibility]'
        );

        if (events.length > 0) {
          ecsEvents$.next(events as NetworkEvent<C>[]);
          lastKnownBlock = response.latestBlock;
          input$.next(createBlockUpdate(lastKnownBlock));
          log.debug(`[Visibility] Sent BlockUpdate to worker ${response.latestBlock}`);
        }
      } catch (err) {
        log.warn('[Visibility] Main thread gapfill failed:', err);
      }
    }
  };

  // Track the latest block number and timestamp for main-thread gapfill
  let blockTrackingSub: Subscription | undefined;
  blockTrackingSub = ecsEvents$.subscribe((events) => {
    const now = Date.now();
    for (const event of events) {
      if ('blockNumber' in event && event.blockNumber > lastKnownBlock) {
        lastKnownBlock = event.blockNumber;
      }
    }
    lastEventTime = now;
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return {
    dispose: () => {
      blockTrackingSub?.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
  };
}
