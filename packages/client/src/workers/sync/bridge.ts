import { log } from 'utils/logger';
import { NetworkComponentUpdate } from '../types';
import { StateCache } from './state';

export interface BridgeBootOptions {
  cache: { current: StateCache };
  toBlock: number;
  gap: (fromBlock: number, skipRpcFallback: boolean) => Promise<NetworkComponentUpdate[]>;
  fetchDelta: (cache: StateCache) => Promise<StateCache>;
}

/**
 * Close the gap between a CDN-loaded state image and the live stream.
 *
 * The streamer is asked first over the whole window, with no RPC fallback: the window
 * can be a full export interval and the log scan walks it 50 blocks at a time. An empty
 * answer means the streamer cache no longer reaches back that far, which the snapshot
 * delta fixes - and the streamer then answers a second ask from the snapshot head,
 * because the snapshot itself always trails the chain by its sync period.
 */
export const bridgeBoot = async ({
  cache,
  toBlock,
  gap,
  fetchDelta,
}: BridgeBootOptions): Promise<NetworkComponentUpdate[]> => {
  const from = cache.current.lastKamigazeBlock;
  log.info('[bridge] streamer-first bridge', { from, toBlock });

  let events = await gap(from, true);
  if (events.length === 0 && toBlock > from) {
    try {
      // on a nonce mismatch fetchDelta replaces the cache wholesale, so the returned
      // object is the one to keep
      cache.current = await fetchDelta(cache.current);
      events = await gap(cache.current.lastKamigazeBlock, false);
    } catch (e) {
      log.warn('[bridge] snapshot delta failed, log-scan over the full window', e);
      events = await gap(from, false);
    }
  }

  return events;
};
