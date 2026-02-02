import { createKamigazeClient, GetEventsSinceResponse } from 'clients/kamigaze';
import { Decode } from 'engine/encoders';
import { Components } from 'engine/recs';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { log } from 'utils/logger';
import { NetworkComponentUpdate, NetworkEvents } from '../../types';
import { fetchEventsInBlockRangeChunked } from '../utils';
import type { FetchWorldEvents } from './stream';

export interface FetchGapEventsOptions {
  kamigazeUrl: string;
  decode: Decode;
  fetchWorldEvents: FetchWorldEvents;
  fromBlock: number;
  toBlock?: number;
  setPercentage?: (percentage: number) => void;
  skipRpcFallback?: boolean;
}

/**
 * Fetch gap events with fallback strategy.
 * 1. Try Kamigaze getEventsSince (fast, gRPC)
 * 2. Fall back to RPC fetchEventsInBlockRangeChunked (slower, but reliable)
 *
 * @returns Array of NetworkComponentUpdate events
 */
export async function fetchGapEvents(
  options: FetchGapEventsOptions
): Promise<NetworkComponentUpdate[]> {
  const {
    kamigazeUrl,
    decode,
    fetchWorldEvents,
    fromBlock,
    toBlock,
    setPercentage,
    skipRpcFallback,
  } = options;

  // Try Kamigaze first
  try {
    log.debug(
      `[gapfill] ${new Date().toISOString()} Trying Kamigaze getEventsSince from block ${fromBlock}...`
    );
    const client = createKamigazeClient(kamigazeUrl);
    const gapResponse = await client.getEventsSince({
      sinceBlock: fromBlock,
    });
    const events = await parseGetEventsSinceResponse(gapResponse, decode, fromBlock, '[Worker]');
    log.debug(
      `[gapfill] ${new Date().toISOString()} Got ${events.length} events from Kamigaze - latestBlock ${gapResponse.latestBlock}`
    );
    setPercentage?.(100);
    return events;
  } catch (err) {
    log.warn(
      `[gapfill] ${new Date().toISOString()} Kamigaze getEventsSince failed, falling back to RPC:`,
      err
    );
  }

  // Fallback to RPC
  if (skipRpcFallback) {
    log.warn(`[gapfill] ${new Date().toISOString()} RPC fallback skipped`);
    return [];
  }

  try {
    log.debug(
      `[gapfill] ${new Date().toISOString()} Using RPC fallback from block ${fromBlock} to ${toBlock}...`
    );
    const events = await fetchEventsInBlockRangeChunked(
      fetchWorldEvents,
      fromBlock,
      toBlock!,
      50,
      setPercentage
    );
    log.debug(`[gapfill] ${new Date().toISOString()} Got ${events.length} events from RPC`);
    return events;
  } catch (rpcErr) {
    log.warn(`[gapfill] ${new Date().toISOString()} RPC fallback failed:`, rpcErr);
    return [];
  }
}

/**
 * Parse GetEventsSinceResponse into NetworkComponentUpdate[].
 *
 * @param response The response from getEventsSince
 * @param decode Function to decode raw component values
 * @param blockNumber Block number to assign to events (defaults to 0)
 * @returns Array of NetworkComponentUpdate events
 */
export async function parseGetEventsSinceResponse(
  response: GetEventsSinceResponse,
  decode: Decode,
  blockNumber: number = 0,
  source: string
): Promise<NetworkComponentUpdate[]> {
  const { events } = response;
  const updates: NetworkComponentUpdate[] = [];

  for (let i = 0; i < events.length; i++) {
    const ecsEvent = events[i]!;

    const component = formatComponentID(ecsEvent.componentId);
    const entity = formatEntityID(ecsEvent.entityId);

    const value =
      ecsEvent.eventType === 'ComponentValueSet'
        ? await decode(component, ecsEvent.value!)
        : undefined;

    const lastEventInTx = events[i + 1]?.txHash !== ecsEvent.txHash;

    updates.push({
      type: NetworkEvents.NetworkComponentUpdate,
      component,
      entity,
      value,
      blockNumber,
      lastEventInTx,
      txHash: ecsEvent.txHash,
      txMetadata: ecsEvent.txMetadata,
    });
  }
  return updates;
}

export interface FillGapOptions {
  kamigazeUrl: string;
  decode: Decode;
  fetchWorldEvents: FetchWorldEvents;
  fromBlock: number;
  toBlock: number;
  setPercentage?: (percentage: number) => void;
}

/**
 * Fill gap between blocks using Kamigaze first, then RPC fallback.
 * Wraps fetchGapEvents with additional error handling.
 *
 * @param options Gap fill configuration
 * @returns Array of NetworkComponentUpdate events
 */
export async function fillGap(
  options: FillGapOptions
): Promise<NetworkComponentUpdate<Components>[]> {
  const { kamigazeUrl, decode, fetchWorldEvents, fromBlock, toBlock, setPercentage } = options;

  try {
    return await fetchGapEvents({
      kamigazeUrl,
      decode,
      fetchWorldEvents,
      fromBlock,
      toBlock,
      setPercentage,
    });
  } catch (err) {
    log.warn(
      `[gapfill] ${new Date().toISOString()} fetchGapEvents failed, falling back to RPC:`,
      err
    );
    return await fetchEventsInBlockRangeChunked(
      fetchWorldEvents,
      fromBlock,
      toBlock,
      50,
      setPercentage
    );
  }
}
