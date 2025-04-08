import { JsonRpcProvider } from '@ethersproject/providers';
import { grpc } from '@improbable-eng/grpc-web';
import { Components, EntityID } from '@mud-classic/recs';
import { abi as WorldAbi } from '@mud-classic/solecs/abi/World.json';
import { World } from '@mud-classic/solecs/types/ethers-contracts';
import { awaitPromise, range, to256BitString, unpackTuple } from '@mud-classic/utils';
import { BigNumber } from 'ethers';
import { createChannel, createClient } from 'nice-grpc-web';
import { Observable, concatMap, map, of } from 'rxjs';

import { createDecode } from 'engine/encoders';
import { ECSStateReplyV2, ECSStateSnapshotServiceClient } from 'engine/types/ecs-snapshot';
import {
  BlockResponse,
  Component,
  Entity,
  KamigazeServiceClient,
  KamigazeServiceDefinition,
  State,
} from 'engine/types/kamigaze/kamigaze';
import { formatComponentID, formatEntityID } from 'engine/utils';
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
import { StateCache, createStateCache, storeEvent } from './state';
import { createTopics } from './topics';

const debug = parentDebug.extend('syncUtils');
interface FetchOptions {
  stateCache: StateCache;
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
  stateCache: StateCache,
  kamigazeClient: KamigazeServiceClient,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage: (percentage: number) => void
): Promise<StateCache> {
  let currentBlock = stateCache.lastKamigazeBlock;
  let initialLoad = currentBlock == 0;

  const options: FetchOptions = { stateCache, kamigazeClient, decode, numChunks, setPercentage };

  //block
  let BlockResponse = await kamigazeClient.getStateBlock({});
  if (stateCache.kamigazeNonce != BlockResponse.nonce) {
    console.log('New nonce found, full state load required');
    options.stateCache = createStateCache();
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

  storeBlock(options.stateCache, BlockResponse);
  options.stateCache.lastKamigazeBlock = BlockResponse.blockNumber;
  options.stateCache.kamigazeNonce = BlockResponse.nonce;

  return options.stateCache;
}

async function fetchComponents({ stateCache, kamigazeClient, setPercentage }: FetchOptions) {
  // remove from the cache any component added by the rpc sync
  stateCache.components.splice(stateCache.lastKamigazeComponent + 1);

  const ComponentsResponse = await kamigazeClient.getComponents({
    fromIdx: stateCache.lastKamigazeComponent,
  });

  storeComponents(stateCache, ComponentsResponse.components);
  stateCache.lastKamigazeComponent = stateCache.components.length - 1;
  setPercentage(5);
}

async function fetchStateRemovals({
  stateCache,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 5;
  const StateRemovalsResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    numChunks,
    removals: true,
  });
  for await (const responseChunk of StateRemovalsResponse) {
    removeValues(stateCache, responseChunk.state);
    setPercentage(percent);
    percent += 3;
  }
}

async function fetchStateValues({
  stateCache,
  kamigazeClient,
  decode,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  let percent = 40;
  const StateValuesResponse = await kamigazeClient.getState({
    fromBlock: stateCache.lastKamigazeBlock,
    numChunks,
    removals: false,
  });

  for await (const responseChunk of StateValuesResponse) {
    storeValues(stateCache, responseChunk.state, decode);
    setPercentage(percent);
    percent += 3;
  }
}

async function fetchEntities({
  stateCache,
  kamigazeClient,
  numChunks = 10,
  setPercentage,
}: FetchOptions) {
  // remove from the cache any entity added by the rpc sync
  let percent = 75;
  stateCache.entities.splice(stateCache.lastKamigazeEntity + 1);

  const EntitiesResponse = kamigazeClient.getEntities({
    fromIdx: stateCache.lastKamigazeEntity,
    numChunks,
  });

  for await (const responseChunk of EntitiesResponse) {
    storeEntities(stateCache, responseChunk.entities);
    setPercentage(percent);
    percent += 3;
  }

  stateCache.lastKamigazeEntity = stateCache.entities.length - 1;
}

export function storeBlock(stateCache: StateCache, block: BlockResponse) {
  stateCache.blockNumber = block.blockNumber;
  console.log('Stored block');
}
export function storeComponents(stateCache: StateCache, components: Component[]) {
  if (typeof components === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (stateCache.components.length == 0) {
    stateCache.components.push('0x0');
  }
  for (const component of components) {
    var hexId = uint8ArrayToHexString(component.id);

    //CHECK INDEX
    if (component.idx != stateCache.components.length) {
      console.log(
        `Component.IDX ${component.idx} does not mach tail of list${stateCache.components.length}`
      );
      continue;
    }

    stateCache.components.push(hexId);
    stateCache.componentToIndex.set(hexId, component.idx);
  }
  console.log('Stored components: ' + stateCache.components.length);
}

export function storeEntities(stateCache: StateCache, entities: Entity[]) {
  if (typeof entities === 'undefined') {
    console.log('No components to store');
    return;
  }
  if (stateCache.entities.length == 0) stateCache.entities.push('0x0');
  for (const entity of entities) {
    var hexId = uint8ArrayToHexString(entity.id);

    //CHECK INDEX
    if (entity.idx != stateCache.entities.length) {
      console.log(
        `Entity.IDX ${entity.idx} does not match tail of list ${stateCache.entities.length}`
      );
      continue;
    }

    stateCache.entities.push(hexId);
    stateCache.entityToIndex.set(hexId, entity.idx);
  }
  console.log('Stored entities');
}

export async function storeValues(
  stateCache: StateCache,
  values: State[],
  decode: ReturnType<typeof createDecode>
) {
  for (const event of values) {
    const { packedIdx, data } = event;
    let componentIdx = unpackTuple(packedIdx)[0];
    const value = await decode(stateCache.components[componentIdx], data);
    stateCache.state.set(packedIdx, value);
  }
  console.log('Stored values');
}

export function removeValues(stateCache: StateCache, values: State[]) {
  for (const event of values) {
    const { packedIdx, data } = event;
    stateCache.state.delete(packedIdx);
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
 * @returns Promise resolving with {@link StateCache} containing the snapshot state.
 */
export async function fetchSnapshotChunked(
  snapshotClient: ECSStateSnapshotServiceClient,
  worldAddress: string,
  decode: ReturnType<typeof createDecode>,
  numChunks = 10,
  setPercentage?: (percentage: number) => void,
  pruneOptions?: { playerAddress: string; hashedComponentId: string }
): Promise<StateCache> {
  const stateCache = createStateCache();
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
      await reduceFetchedState(responseChunk, stateCache, decode);
      setPercentage && setPercentage((i++ / numChunks) * 100);
    }
  } catch (e) {
    console.error(e);
  }

  return stateCache;
}

/**
 * Reduces a snapshot response by storing corresponding ECS events into the cache store.
 *
 * @param response ECSStateReplyV2
 * @param stateCache {@link StateCache} to store snapshot state into.
 * @param decode Function to decode raw component values ({@link createDecode}).
 * @returns Promise resolving once state is reduced into {@link StateCache}.
 */
export async function reduceFetchedState(
  response: ECSStateReplyV2,
  stateCache: StateCache,
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
    storeEvent(stateCache, {
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
//  * @returns Promise resolving with {@link StateCache} containing the contract ECS state in the given block range.
//  */
// export async function fetchStateInBlockRange(
//   fetchWorldEvents: ReturnType<typeof createFetchWorldEventsInBlockRange>,
//   fromBlockNumber: number,
//   toBlockNumber: number,
//   interval = 50,
//   setPercentage?: (percentage: number) => void
// ): Promise<StateCache> {
//   const stateCache = createStateCache();

//   const events = await fetchEventsInBlockRangeChunked(
//     fetchWorldEvents,
//     fromBlockNumber,
//     toBlockNumber,
//     interval,
//     setPercentage
//   );

//   storeEvents(stateCache, events);

//   return stateCache;
// }

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
