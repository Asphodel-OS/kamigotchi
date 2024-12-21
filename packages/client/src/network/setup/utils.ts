import { JsonRpcProvider } from '@ethersproject/providers';
import {
  Component,
  Components,
  EntityID,
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  removeComponent,
  Schema,
  setComponent,
  Type,
  World,
} from '@mud-classic/recs';
import { Component as SolecsComponent } from '@mud-classic/solecs';
import ComponentAbi from '@mud-classic/solecs/abi/Component.json';
import { toEthAddress } from '@mud-classic/utils';
import { Contract, Signer } from 'ethers';
import { compact, toLower } from 'lodash';
import { IComputedValue } from 'mobx';
import { filter, map, Observable, Subject, timer } from 'rxjs';

import { createEncoder } from 'engine/encoders';
import { Mappings } from 'engine/types';
import { formatEntityID } from 'engine/utils';
import { Ack, ack } from 'workers/sync';
import {
  isNetworkComponentUpdateEvent,
  isSystemCallEvent,
  NetworkComponentUpdate,
  NetworkEvent,
  SystemCall,
} from 'workers/types';
import { DecodedNetworkComponentUpdate, DecodedSystemCall } from './types';

export function createDecodeNetworkComponentUpdate<C extends Components>(
  world: World,
  components: C,
  mappings: Mappings<C>
): (update: NetworkComponentUpdate) => DecodedNetworkComponentUpdate | undefined {
  return (update: NetworkComponentUpdate) => {
    const entity =
      world.entityToIndex.get(update.entity) ?? world.registerEntity({ id: update.entity });
    const componentKey = mappings[update.component];
    if (!componentKey) {
      console.error(`
        Component mapping not found for component ID 
        ${update.component} ${JSON.stringify(update.value)}
      `);
      return undefined;
    }

    return {
      ...update,
      entity,
      component: components[componentKey] as Component<Schema>,
    };
  };
}

export function createSystemCallStreams<
  C extends Components,
  SystemTypes extends { [key: string]: Contract },
>(
  world: World,
  systemNames: string[],
  systemsRegistry: Component<{ value: Type.String }>,
  getSystemContract: (systemId: string) => { name: string; contract: Contract },
  decodeNetworkComponentUpdate: ReturnType<typeof createDecodeNetworkComponentUpdate>
) {
  const systemCallStreams = systemNames.reduce(
    (streams, systemId) => ({
      ...streams,
      [systemId]: new Subject<DecodedSystemCall<SystemTypes>>(),
    }),
    {} as Record<string, Subject<DecodedSystemCall<SystemTypes, C>>>
  );

  return {
    systemCallStreams,
    decodeAndEmitSystemCall: (systemCall: SystemCall<C>) => {
      const { tx } = systemCall;

      const systemEntityIndex = world.entityToIndex.get(toLower(formatEntityID(tx.to)) as EntityID);
      if (!systemEntityIndex) return;

      const hashedSystemId = getComponentValue(systemsRegistry, systemEntityIndex)?.value;
      if (!hashedSystemId) return;

      const { name, contract } = getSystemContract(hashedSystemId);

      const decodedTx = contract.interface.parseTransaction({ data: tx.data, value: tx.value });

      // If this is a newly registered System make a new Subject
      if (!systemCallStreams[name]) {
        systemCallStreams[name] = new Subject<DecodedSystemCall<SystemTypes>>();
      }

      systemCallStreams[name].next({
        ...systemCall,
        updates: compact(systemCall.updates.map(decodeNetworkComponentUpdate)),
        systemId: name,
        args: decodedTx.args,
      });
    },
  };
}

export async function createEncoders(
  world: World,
  components: Component<{ value: Type.String }>,
  signerOrProvider: IComputedValue<JsonRpcProvider | Signer>
) {
  const encoders = {} as Record<string, ReturnType<typeof createEncoder>>;

  async function fetchAndCreateEncoder(entity: EntityIndex) {
    const componentAddress = toEthAddress(world.entities[entity]);
    const componentId = getComponentValueStrict(components, entity).value;
    console.info('[SyncUtils] Creating encoder for ' + componentAddress);
    const componentContract = new Contract(
      componentAddress,
      ComponentAbi.abi,
      signerOrProvider.get()
    ) as SolecsComponent;
    const [componentSchemaPropNames, componentSchemaTypes] = await componentContract.getSchema();
    encoders[componentId] = createEncoder(componentSchemaPropNames, componentSchemaTypes);
  }

  // Initial setup
  for (const entity of getComponentEntities(components)) fetchAndCreateEncoder(entity);

  // Keep up to date
  const subscription = components.update$.subscribe((update) =>
    fetchAndCreateEncoder(update.entity)
  );
  world.registerDisposer(() => subscription?.unsubscribe());

  return encoders;
}

/**
 * Sets up synchronization between contract components and client components
 */
export function applyNetworkUpdates<C extends Components>(
  world: World,
  components: C,
  ecsEvents$: Observable<NetworkEvent<C>[]>,
  mappings: Mappings<C>,
  ack$: Subject<Ack>,
  decodeAndEmitSystemCall?: (event: SystemCall<C>) => void
) {
  const txReduced$ = new Subject<string>();

  // Send "ack" to tell the sync worker we're ready to receive events while not processing
  let processing = false;
  const ackSub = timer(0, 100)
    .pipe(
      filter(() => !processing),
      map(() => ack)
    )
    .subscribe(ack$);

  const delayQueueSub = ecsEvents$.subscribe((updates) => {
    processing = true;
    for (const update of updates) {
      if (isNetworkComponentUpdateEvent<C>(update)) {
        if (update.lastEventInTx) txReduced$.next(update.txHash);

        const entity =
          world.entityToIndex.get(update.entity) ?? world.registerEntity({ id: update.entity });
        const componentKey = mappings[update.component];
        if (!componentKey) {
          console.warn('Unknown component:', update);
          continue;
        }

        if (update.value === undefined) {
          // undefined value means component removed
          removeComponent(components[componentKey] as Component<Schema>, entity);
        } else {
          setComponent(components[componentKey] as Component<Schema>, entity, update.value);
        }
      } else if (decodeAndEmitSystemCall && isSystemCallEvent(update)) {
        decodeAndEmitSystemCall(update);
      }
    }
    // Send "ack" after every processed batch of events to process faster than ever 100ms
    ack$.next(ack);
    processing = false;
  });

  world.registerDisposer(() => {
    delayQueueSub?.unsubscribe();
    ackSub?.unsubscribe();
  });
  return { txReduced$: txReduced$.asObservable() };
}
