import '@ethersproject/abstract-provider'; // we really need to figure out why this is necessary
import { Metadata, Type, World, defineComponent } from '@mud-classic/recs';
import { abi as WorldAbi } from '@mud-classic/solecs/abi/World.json';
import { keccak256 } from '@mud-classic/utils';
import { Contract, ContractInterface } from 'ethers';
import { keys } from 'lodash';
import { Subject } from 'rxjs';

import { Network, createNetwork, createSystemExecutor } from 'engine/executors';
import { Mappings } from 'engine/types';
import { createSyncWorker } from 'workers/create';
import { Ack, InputType } from 'workers/sync';
import {
  ContractComponent,
  ContractComponents,
  NetworkComponents,
  SetupContractConfig,
} from './types';
import {
  applyNetworkUpdates,
  createDecodeNetworkComponentUpdate,
  createSystemCallStreams,
} from './utils';

export async function setupMUDNetwork<
  C extends ContractComponents,
  SystemTypes extends { [key: string]: Contract },
>(
  world: World,
  contractComponents: C,
  SystemAbis: { [key in keyof SystemTypes]: ContractInterface },
  networkConfig: SetupContractConfig,
  options?: { initialGasPrice?: number; fetchSystemCalls?: boolean }
) {
  const SystemsRegistry = findOrDefineComponent(
    contractComponents,
    defineRegistryComponent(world, {
      id: 'SystemsRegistry',
      metadata: { contractId: 'world.component.systems' },
    })
  );

  const ComponentsRegistry = findOrDefineComponent(
    contractComponents,
    defineRegistryComponent(world, {
      id: 'ComponentsRegistry',
      metadata: { contractId: 'world.component.components' },
    })
  );

  // used by SyncWorker to notify client of sync progress
  const LoadingState = findOrDefineComponent(
    contractComponents,
    defineComponent(
      world,
      {
        state: Type.Number,
        msg: Type.String,
        percentage: Type.Number,
      },
      {
        id: 'LoadingState',
        metadata: { contractId: 'component.LoadingState' },
      }
    )
  );

  const components: NetworkComponents<C> = {
    ...contractComponents,
    SystemsRegistry,
    ComponentsRegistry,
    LoadingState,
  };

  // Mapping from component contract id to key in components object
  const mappings: Mappings<C> = {};

  // Register initial components in mappings object
  for (const key of Object.keys(components)) {
    const { contractId } = components[key].metadata;
    mappings[keccak256(contractId)] = key;
  }

  // create the network from the connected signer/provider
  // NOTE: tbh not sure what the purpose of this is aside from the pacemaking
  const network = await createNetwork(networkConfig);
  world.registerDisposer(network.dispose);

  // create the system executor
  const { txQueue, getSystemContract } = createSystemExecutor<SystemTypes>(
    world,
    network,
    SystemsRegistry,
    SystemAbis
  );

  const decodeNetworkUpdate = createDecodeNetworkComponentUpdate(world, components, mappings);
  const { decodeAndEmitSystemCall } = createSystemCallStreams(
    world,
    keys(SystemAbis),
    SystemsRegistry,
    // @ts-ignore: we'll fix this type mismatch later..
    getSystemContract,
    decodeNetworkUpdate
  );

  // create the sync web worker
  const ack$ = new Subject<Ack>();
  const {
    provider: { externalProvider: _, ...providerConfig },
    ...syncWorkerConfig
  } = networkConfig;
  const { ecsEvents$, input$, dispose } = createSyncWorker<C>(ack$);
  world.registerDisposer(dispose);

  const { txReduced$ } = applyNetworkUpdates(
    world,
    components,
    ecsEvents$,
    mappings,
    ack$,
    decodeAndEmitSystemCall
  );

  // define the startSync function which submits the following data to the sync worker
  // NOTE: this constructs and passes in the config. we should do this more explicitly
  // We have like three separate config definitions between:
  // - engine/types
  // - network/setup/types
  // - workers/types
  // This is a bit of a mess. We should probably figure out what we want to do here to
  // reduce the brittleness of the logical flow and make the workers/network easier to
  // configure and reason about.
  function startSync() {
    input$.next({
      type: InputType.Config,
      data: {
        ...syncWorkerConfig,
        provider: providerConfig,
        worldContract: { abi: WorldAbi, address: networkConfig.worldAddress },
        initialBlockNumber: networkConfig.initialBlockNumber ?? 0,
        disableCache: networkConfig.devMode, // Disable cache on local networks (hardhat / anvil)
        fetchSystemCalls: options?.fetchSystemCalls,
      },
    });
  }

  // allows us to create arbitrary System Executor instances by just passing in a Network
  function createTxQueue(network: Network) {
    const { txQueue } = createSystemExecutor<SystemTypes>(
      world,
      network,
      SystemsRegistry,
      SystemAbis
    );
    return txQueue;
  }

  return {
    network,
    startSync,
    txQueue,
    createTxQueue,
    txReduced$,
  };
}

/**
 * Find a component in the components object by contract id, or return the component if it doesn't exist
 * @param components object of components
 * @param component component to find
 * @returns component if it exists in components object, otherwise the component passed in
 */
function findOrDefineComponent<Cs extends ContractComponents, C extends ContractComponent>(
  components: Cs,
  component: C
): C {
  const existingComponent = Object.values(components).find(
    (c) => c.metadata.contractId === component.metadata.contractId
  ) as C;

  if (existingComponent && component.metadata.contractId !== 'component.LoadingState') {
    console.warn(
      'Component with contract id',
      component.metadata.contractId,
      'is defined by default in setupMUDNetwork'
    );
  }

  return existingComponent || component;
}

/**
 * defines a registry component (for Components or Systems)
 */
function defineRegistryComponent<M extends Metadata>(
  world: World,
  options?: { id?: string; metadata?: M; indexed?: boolean }
) {
  return defineComponent<{ value: Type.String }, M>(world, { value: Type.String }, options);
}
