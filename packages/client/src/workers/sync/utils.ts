import { JsonRpcProvider } from '@ethersproject/providers';
import { ComponentValue, Components, EntityID } from '@mud-classic/recs';
import { abi as WorldAbi } from '@mud-classic/solecs/abi/World.json';
import { World } from '@mud-classic/solecs/types/ethers-contracts';
import { awaitPromise, range, to256BitString, unpackTuple } from '@mud-classic/utils';
import { BigNumber, BytesLike } from 'ethers';
import { createChannel, createClient } from 'nice-grpc-web';
import { Observable, concatMap, map, of } from 'rxjs';

import { grpc } from '@improbable-eng/grpc-web';
import { createDecoder } from 'engine/encoders';
import {
  ECSStateReplyV2,
  ECSStateSnapshotServiceClient,
} from 'engine/types/ecs-snapshot/ecs-snapshot';
import {
  BlockResponse,
  Component,
  Entity,
  KamigazeServiceClient,
  KamigazeServiceDefinition,
  State,
} from 'engine/types/kamigaze/kamigaze';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { ComponentsSchema } from 'types/ComponentsSchema';
import { uint8ArrayToHexString } from 'utils/numbers';
import { ContractConfig } from 'workers/types';
import { debug as parentDebug } from '../debug';
import {
  NetworkComponentUpdate,
  NetworkEvent,
  NetworkEvents,
  SystemCall,
  SystemCallTransaction,
} from '../types';
import { fetchEventsInBlockRange } from './blocks';
import { CacheStore, createCacheStore, storeEvent } from './cache';
import { createTopics } from './topics';

const debug = parentDebug.extend('syncUtils');
interface FetchOptions {
  cacheStore: CacheStore;
  kamigazeClient: KamigazeServiceClient;
  decode: ReturnType<typeof createDecode>;
  numChunks?: number;
  setPercentage: (percentage: number) => void;
}

/**
 * KAMIGAZE INTEGRATION
 **/

export function createSnapshotClient(url: string): KamigazeServiceClient {
  return createClient(KamigazeServiceDefinition, createChannel(url, grpc.WebsocketTransport()));
}

export async function fetchStateFromKamigaze(
  cacheStore: CacheStore,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage: (percentage: number) => void
): Promise<CacheStore> {
  let currentBlock = cacheStore.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  const options: FetchOptions = { cacheStore, kamigazeClient, decode, numChunks, setPercentage };

  //block
  let BlockResponse = await kamigazeClient.getStateBlock({});
  if (cacheStore.kamigazeNonce != BlockResponse.nonce) {
    console.log('New nonce found, full state load required');
    options.cacheStore = createCacheStore();
    initialLoad = true;
  }

  try {
    await fetchComponents(options);
    if (!initialLoad) {
      await fetchStateRemovals(options);
    }
    await fetchStateValues(options);
    await fetchEntities(options);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }

  storeBlock(options.cacheStore, BlockResponse);
  options.cacheStore.lastKamigazeBlock = BlockResponse.blockNumber;
  options.cacheStore.kamigazeNonce = BlockResponse.nonce;

  return options.cacheStore;
}

async function fetchComponents({ cacheStore, kamigazeClient, setPercentage }: FetchOptions) {
  // remove from the cache any component added by the rpc sync
  cacheStore.components.splice(cacheStore.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: cacheStore.lastKamigazeComponent,
  });

  storeComponents(cacheStore, ComponentsResponse.components);
  cacheStore.lastKamigazeComponent = cacheStore.components.length - 1;
  setPercentage(5);
}

async function fetchStateRemovals({
  cacheStore,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 5;
  const StateRemovalsResponse = await kamigazeClient.getState({
    fromBlock: cacheStore.lastKamigazeBlock,
    numChunks,
    removals: true,
  });
  for await (const responseChunk of StateRemovalsResponse) {
    removeValues(cacheStore, responseChunk.state);
    setPercentage(percent);
    percent += 3;
  }
}

async function fetchStateValues({
  cacheStore,
  kamigazeClient,
  decode,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 40;
  const StateValuesResponse = await kamigazeClient.getState({
    fromBlock: cacheStore.lastKamigazeBlock,
    numChunks,
    removals: false,
  });

  for await (const responseChunk of StateValuesResponse) {
    storeValues(cacheStore, responseChunk.state, decode);
    setPercentage(percent);
    percent += 3;
  }
}

async function fetchEntities({
  cacheStore,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  // remove from the cache any entity added by the rpc sync
  let percent = 75;
  cacheStore.entities.splice(cacheStore.lastKamigazeEntity + 1);

  const EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: cacheStore.lastKamigazeEntity,
    numChunks,
  });

  for await (const responseChunk of EntitiesResponse) {
    storeEntities(cacheStore, responseChunk.entities);
    setPercentage(percent);
    percent += 3;
  }

  cacheStore.lastKamigazeEntity = cacheStore.entities.length - 1;
}

export function storeBlock(cacheStore: CacheStore, block: BlockResponse) {
  cacheStore.blockNumber = block.blockNumber;
  console.log('Stored block');
}
export function storeComponents(cacheStore: CacheStore, components: Component[]) {
  if (typeof components === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (cacheStore.components.length == 0) {
    cacheStore.components.push('0x0');
  }
  for (const component of components) {
    var hexId = uint8ArrayToHexString(component.id);

    //CHECK INDEX
    if (component.idx != cacheStore.components.length) {
      console.log(
        `Component.IDX ${component.idx} does not mach tail of list${cacheStore.components.length}`
      );
      continue;
    }

    cacheStore.components.push(hexId);
    cacheStore.componentToIndex.set(hexId, component.idx);
  }
  console.log('Stored components: ' + cacheStore.components.length);
}

export function storeEntities(cacheStore: CacheStore, entities: Entity[]) {
  if (typeof entities === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (cacheStore.entities.length == 0) cacheStore.entities.push('0x0');
  for (const entity of entities) {
    var hexId = uint8ArrayToHexString(entity.id);

    //CHECK INDEX
    if (entity.idx != cacheStore.entities.length) {
      console.log(
        `Entity.IDX ${entity.idx} does not match tail of list ${cacheStore.entities.length}`
      );
      continue;
    }

    cacheStore.entities.push(hexId);
    cacheStore.entityToIndex.set(hexId, entity.idx);
  }
  console.log('Stored entities');
}

export async function storeValues(
  cacheStore: CacheStore,
  values: State[],
  decode: ReturnType<typeof createDecode>
) {
  for (const event of values) {
    const { packedIdx, data } = event;
    let componentIdx = unpackTuple(packedIdx)[0];
    const value = await decode(cacheStore.components[componentIdx], data);
    cacheStore.state.set(packedIdx, value);
  }
  console.log('Stored values');
}

export function removeValues(cacheStore: CacheStore, values: State[]) {
  for (const event of values) {
    const { packedIdx, data } = event;
    cacheStore.state.delete(packedIdx);
  }
  console.log('Removed values');
}
/************************************* END KAMIGAZE INTEGRATION *************************************/
/**
 * Load from the remote snapshot service in chunks via a stream.
 *
 * @param snapshotClient ECSStateSnapshotServiceClient
 * @param worldAddress Address of the World contract to get the snapshot for.
 * @param decode Function to decode raw component values ({@link createDecode}).
 * @returns Promise resolving with {@link CacheStore} containing the snapshot state.
 */
export async function fetchSnapshotChunked(
  snapshotClient: ECSStateSnapshotServiceClient,
  worldAddress: string,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage?: (percentage: number) => void,
  pruneOptions?: { playerAddress: string; hashedComponentId: string }
): Promise<CacheStore> {
  const cacheStore = createCacheStore();
  const chunkPercentage = Math.ceil(100 / numChunks);

  try {
    const response = pruneOptions
      ? snapshotClient.getStateLatestStreamPrunedV2({
          worldAddress,
          chunkPercentage,
          pruneAddress: pruneOptions?.playerAddress,
          pruneComponentId: pruneOptions?.hashedComponentId,
        })
      : snapshotClient.getStateLatestStreamV2({
          worldAddress,
          chunkPercentage,
        });

    let i = 0;
    for await (const responseChunk of response) {
      await reduceFetchedState(responseChunk, cacheStore, decode);
      setPercentage && setPercentage((i++ / numChunks) * 100);
    }
  } catch (e) {
    console.error(e);
  }

  return cacheStore;
}

/**
 * Reduces a snapshot response by storing corresponding ECS events into the cache store.
 *
 * @param response ECSStateReplyV2
 * @param cacheStore {@link CacheStore} to store snapshot state into.
 * @param decode Function to decode raw component values ({@link createDecode}).
 * @returns Promise resolving once state is reduced into {@link CacheStore}.
 */
export async function reduceFetchedState(
  response: ECSStateReplyV2,
  cacheStore: CacheStore,
  decode: ReturnType<typeof createDecode>
): Promise<void> {
  const { state, blockNumber, stateComponents, stateEntities } = response;
  const stateEntitiesHex = stateEntities.map((e) => uint8ArrayToHexString(e) as EntityID);
  const stateComponentsHex = stateComponents.map((e) => to256BitString(e));

  for (const { componentIdIdx, entityIdIdx, value: rawValue } of state) {
    const component = stateComponentsHex[componentIdIdx]!;
    const entity = stateEntitiesHex[entityIdIdx]!;
    if (entity == undefined) debug('invalid entity index', stateEntities.length, entityIdIdx);
    const value = await decode(component, rawValue);
    storeEvent(cacheStore, {
      type: NetworkEvents.NetworkComponentUpdate,
      component,
      entity,
      value,
      blockNumber,
    });
  }
}

/**
 * Create a RxJS stream of {@link NetworkComponentUpdate}s by listening to new
 * blocks from the blockNumber$ stream and fetching the corresponding block
 * from the connected RPC.
 *
 * @dev Only use if {@link createLatestEventStreamService} is not available.
 *
 * @param blockNumber$ Block number stream
 * @param fetchWorldEvents Function to fetch World events in a block range ({@link createFetchWorldEventsInBlockRange}).
 * @returns Stream of {@link NetworkComponentUpdate}s.
 */
export function createLatestEventStreamRPC(
  blockNumber$: Observable<number>,
  fetchWorldEvents: ReturnType<typeof createFetchWorldEventsInBlockRange>,
  fetchSystemCallsFromEvents?: ReturnType<typeof createFetchSystemCallsFromEvents>
): Observable<NetworkEvent> {
  let lastSyncedBlockNumber: number | undefined;

  return blockNumber$.pipe(
    map(async (blockNumber) => {
      const from =
        lastSyncedBlockNumber == null || lastSyncedBlockNumber >= blockNumber
          ? blockNumber
          : lastSyncedBlockNumber + 1;
      const to = blockNumber;
      lastSyncedBlockNumber = to;
      const events = await fetchWorldEvents(from, to);
      // console.log(`[rpc] fetched ${events.length} events from block range ${from} -> ${to}`);

      if (fetchSystemCallsFromEvents && events.length > 0) {
        const systemCalls = await fetchSystemCallsFromEvents(events, blockNumber);
        return [...events, ...systemCalls];
      }

      return events;
    }),
    awaitPromise(),
    concatMap((v) => of(...v))
  );
}

/**
 * Fetch ECS events from contracts in the given block range.
 *
 * @param fetchWorldEvents Function to fetch World events in a block range ({@link createFetchWorldEventsInBlockRange}).
 * @param fromBlockNumber Start of block range (inclusive).
 * @param toBlockNumber End of block range (inclusive).
 * @param interval Chunk fetching the blocks in intervals to avoid overwhelming the client.
 * @returns Promise resolving with array containing the contract ECS events in the given block range.
 */
export async function fetchEventsInBlockRangeChunked(
  fetchWorldEvents: ReturnType<typeof createFetchWorldEventsInBlockRange>,
  fromBlockNumber: number,
  toBlockNumber: number,
  interval = 50,
  setPercentage?: (percentage: number) => void
): Promise<NetworkComponentUpdate<Components>[]> {
  const events: NetworkComponentUpdate<Components>[] = [];
  const delta = toBlockNumber - fromBlockNumber;
  const numSteps = Math.ceil(delta / interval);
  const steps = [...range(numSteps, interval, fromBlockNumber)];

  for (let i = 0; i < steps.length; i++) {
    const from = steps[i]!;
    const to = i === steps.length - 1 ? toBlockNumber : steps[i + 1]! - 1;
    const chunkEvents = await fetchWorldEvents(from, to);

    if (setPercentage) setPercentage(((i * interval) / delta) * 100);
    debug(`initial sync fetched ${events.length} events from block range ${from} -> ${to}`);

    events.push(...chunkEvents);
  }

  return events;
}

/**
 * Create World contract topics for the `ComponentValueSet` and `ComponentValueRemoved` events.
 * @returns World contract topics for the `ComponentValueSet` and `ComponentValueRemoved` events.
 */
export function createWorldTopics() {
  return createTopics<{ World: World }>({
    World: { abi: WorldAbi, topics: ['ComponentValueSet', 'ComponentValueRemoved'] },
  });
}

/**
 * Create a function to fetch World contract events in a given block range.
 * @param provider ethers JsonRpcProvider
 * @param worldConfig Contract address and interface of the World contract.
 * @param batch Set to true if the provider supports batch queries (recommended).
 * @param decode Function to decode raw component values ({@link createDecode})
 * @returns Function to fetch World contract events in a given block range.
 */
export function createFetchWorldEventsInBlockRange<C extends Components>(
  provider: JsonRpcProvider,
  worldConfig: ContractConfig,
  batch: boolean | undefined,
  decode: ReturnType<typeof createDecode>
) {
  const topics = createWorldTopics();

  // Fetches World events in the provided block range (including from and to)
  return async (from: number, to: number) => {
    const contractsEvents = await fetchEventsInBlockRange(
      provider,
      topics,
      from,
      to,
      { World: worldConfig },
      batch
    );
    const ecsEvents: NetworkComponentUpdate<C>[] = [];

    for (const event of contractsEvents) {
      const { lastEventInTx, txHash, args } = event;
      const {
        component: address, // not used anymore but keep for reference
        entity: entityId,
        data,
        componentId: rawComponentId,
      } = args as unknown as {
        component: string;
        entity: BigNumber;
        data: string;
        componentId: BigNumber;
      };

      const component = formatComponentID(rawComponentId);
      const entity = formatEntityID(entityId);
      const blockNumber = to;

      const ecsEvent = {
        type: NetworkEvents.NetworkComponentUpdate,
        component,
        entity,
        value: undefined,
        blockNumber,
        lastEventInTx,
        txHash,
      } as NetworkComponentUpdate<C>;

      if (event.eventKey === 'ComponentValueRemoved') {
        ecsEvents.push(ecsEvent);
      }

      if (event.eventKey === 'ComponentValueSet') {
        const value = await decode(component, data);
        ecsEvents.push({ ...ecsEvent, value });
      }
    }

    return ecsEvents;
  };
}

export function createFetchSystemCallsFromEvents(provider: JsonRpcProvider) {
  const { fetchBlock, clearBlock } = createBlockCache(provider);

  // fetch the call data of a transaction by its hash/block number
  // Q(jb): are we even using this function?
  const fetchSystemCallData = async (txHash: string, blockNumber: number) => {
    const block = await fetchBlock(blockNumber);
    if (!block) return;
    const tx = block.transactions.find((tx) => tx.hash === txHash);
    if (!tx) return;

    return {
      to: tx.to,
      data: tx.data,
      value: tx.value,
      hash: tx.hash,
    } as SystemCallTransaction;
  };

  return async (events: NetworkComponentUpdate[], blockNumber: number) => {
    const systemCalls: SystemCall[] = [];
    const transactionHashToEvents = groupByTxHash(events);

    const txData = await Promise.all(
      Object.keys(transactionHashToEvents).map((hash) => fetchSystemCallData(hash, blockNumber))
    );
    clearBlock(blockNumber);

    for (const tx of txData) {
      if (!tx) continue;

      systemCalls.push({
        type: NetworkEvents.SystemCall,
        tx,
        updates: transactionHashToEvents[tx.hash]!,
      });
    }

    return systemCalls;
  };
}

function createBlockCache(provider: JsonRpcProvider) {
  const blocks: Record<number, Awaited<ReturnType<typeof provider.getBlockWithTransactions>>> = {};

  return {
    fetchBlock: async (blockNumber: number) => {
      if (blocks[blockNumber]) return blocks[blockNumber];

      const block = await provider.getBlockWithTransactions(blockNumber);
      blocks[blockNumber] = block;

      return block;
    },
    clearBlock: (blockNumber: number) => delete blocks[blockNumber],
  };
}

// /**
//  * Fetch ECS state from contracts in the given block range.
//  *
//  * @param fetchWorldEvents Function to fetch World events in a block range ({@link createFetchWorldEventsInBlockRange}).
//  * @param fromBlockNumber Start of block range (inclusive).
//  * @param toBlockNumber End of block range (inclusive).
//  * @param interval Chunk fetching the blocks in intervals to avoid overwhelming the client.
//  * @returns Promise resolving with {@link CacheStore} containing the contract ECS state in the given block range.
//  */
// export async function fetchStateInBlockRange(
//   fetchWorldEvents: ReturnType<typeof createFetchWorldEventsInBlockRange>,
//   fromBlockNumber: number,
//   toBlockNumber: number,
//   interval = 50,
//   setPercentage?: (percentage: number) => void
// ): Promise<CacheStore> {
//   const cacheStore = createCacheStore();

//   const events = await fetchEventsInBlockRangeChunked(
//     fetchWorldEvents,
//     fromBlockNumber,
//     toBlockNumber,
//     interval,
//     setPercentage
//   );

//   storeEvents(cacheStore, events);

//   return cacheStore;
// }

/**
 * Create a function to decode raw component values.
 * Fetches component schemas from the contracts and caches them.
 *
 * @param worldConfig Contract address and interface of the World contract
 * @param provider ethers JsonRpcProvider
 * @returns Function to decode raw component values using their contract component id
 */
export function createDecode() {
  const decoders: { [key: string]: (data: BytesLike) => ComponentValue } = {};
  // hardcode world.component.components and world.component.systems to use uint256 schema
  // NOTE: maybe compute these keys with keccaks or keep a constants file for readability
  decoders['0x4350dba81aa91e31664a09d24a668f006169a11b3d962b7557aed362d3252aec'] = createDecoder(
    ['value'],
    [13]
  ); // world.component.components
  decoders['0x017c816a964927a00e050edd780dcf113ca2756dfa9e9fda94a05c140d9317b0'] = createDecoder(
    ['value'],
    [13]
  ); // world.component.systems
  async function decode(componentId: string, data: BytesLike): Promise<ComponentValue> {
    if (!decoders[componentId]) {
      debug('Creating decoder for', componentId);
      const compID = componentId as keyof typeof ComponentsSchema;
      let schema = ComponentsSchema[compID];
      if (!schema) {
        console.warn(`No schema found for component ${String(compID)}`);
        // set bool as a default schema - only to prevent errors
        // TODO: whitelist components to listen to (need in snapshot & here)
        schema = { keys: ['value'], values: [0] };
      }
      decoders[componentId] = createDecoder(schema.keys, schema.values);
    }
    // Decode the raw value
    return decoders[componentId]!(data);
  }

  return decode;
}

export function groupByTxHash(events: NetworkComponentUpdate[]) {
  return events.reduce(
    (acc, event) => {
      if (['worker', 'cache'].includes(event.txHash)) return acc;

      if (!acc[event.txHash]) acc[event.txHash] = [];
      acc[event.txHash]!.push(event);

      return acc;
    },
    {} as { [key: string]: NetworkComponentUpdate[] }
  );
}
