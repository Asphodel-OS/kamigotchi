import { JsonRpcProvider } from '@ethersproject/providers';
import { Components, EntityID } from '@mud-classic/recs';
import { abi as WorldAbi } from '@mud-classic/solecs/abi/World.json';
import { World } from '@mud-classic/solecs/types/ethers-contracts';
import { awaitPromise, range, to256BitString } from '@mud-classic/utils';
import { BigNumber } from 'ethers';
import { Observable, concatMap, map, of } from 'rxjs';

import { createDecode } from 'engine/encoders';
import {
  ECSStateReplyV2,
  ECSStateSnapshotServiceClient,
} from 'engine/types/ecs-snapshot/ecs-snapshot';
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
import { CacheStore, createStateCache, storeEvent } from './cache';
import { createTopics } from './topics';

const debug = parentDebug.extend('syncUtils');

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
  const cacheStore = createStateCache();
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
//   const cacheStore = createStateCache();

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
