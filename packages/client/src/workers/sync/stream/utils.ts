import { createDecode, Decode } from 'engine/encoders';
import { StreamResponse } from 'engine/types/kamigaze/kamigaze';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { NetworkComponentUpdate, NetworkEvents } from '../../types';

export type TransformWorldEvents = ReturnType<typeof createTransformWorldEvents>;

/**
 * Create a function to transform World contract events from a stream service response chunk.
 * @param decode Function to decode raw component values ({@link createDecode})
 * @returns Function to transform World contract events from a stream service.
 */
export const createTransformWorldEvents = (decode: Decode) => {
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
};
