import { ethers } from 'ethers';

import { StreamResponse } from 'clients/kamigaze';
import { Decode } from 'engine/encoders';
import { formatComponentID, formatEntityID } from 'engine/utils';
import {
  NetworkComponentUpdate,
  NetworkEvents,
  SystemCall,
  SystemCallTransaction,
} from '../../types';

export type TransformWorldEvents = ReturnType<typeof createTransformWorldEvents>;

/**
 * Create a function to transform World contract events from a stream service response chunk.
 * @param decode Function to decode raw component values ({@link createDecode})
 * @returns Function to transform World contract events from a stream service.
 */
export const createTransformWorldEvents = (decode: Decode) => {
  return async (message: StreamResponse): Promise<NetworkComponentUpdate[]> => {
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
      // different transaction then the current, which would mean an event associated with another tx
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
};

/**
 * Group events by transaction hash.
 */
export const groupByTxHash = (
  events: NetworkComponentUpdate[]
): Record<string, NetworkComponentUpdate[]> => {
  const result: Record<string, NetworkComponentUpdate[]> = {};
  for (const event of events) {
    if (!result[event.txHash]) {
      result[event.txHash] = [];
    }
    result[event.txHash]!.push(event);
  }
  return result;
};

/**
 * Parse SystemCalls from a list of NetworkComponentUpdates.
 */
export const parseSystemCalls = (events: NetworkComponentUpdate[]): SystemCall[] => {
  const systemCalls: SystemCall[] = [];
  const transactionHashToEvents = groupByTxHash(events);

  for (const txHash of Object.keys(transactionHashToEvents)) {
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

/**
 * Parse a SystemCallTransaction from a NetworkComponentUpdate.
 */
export const parseSystemCall = (event: NetworkComponentUpdate): SystemCallTransaction | null => {
  if (!event.txMetadata) return null;
  const { to, data, value } = event.txMetadata;
  return {
    to,
    data: ethers.hexlify(data),
    value: BigInt(value),
    hash: event.txHash,
  } as SystemCallTransaction;
};
