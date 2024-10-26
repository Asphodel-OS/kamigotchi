import { JsonRpcProvider } from '@ethersproject/providers';
import { ComponentValue, Components, EntityID } from '@mud-classic/recs';
import { abi as WorldAbi } from '@mud-classic/solecs/abi/World.json';
import { World } from '@mud-classic/solecs/types/ethers-contracts';
import { awaitPromise, range, to256BitString } from '@mud-classic/utils';
import { BigNumber, BytesLike } from 'ethers';
import { Observable, concatMap, map, of } from 'rxjs';

import { createDecoder } from 'engine/encoders';
import { ECSStateReplyV2 } from 'engine/types/ecs-snapshot/ecs-snapshot';
import { formatComponentID, formatEntityID } from 'engine/utils';
import { ComponentsSchema } from 'types/ComponentsSchema';
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
import { CacheStore, storeEvent } from './cache';
import { createTopics } from './topics';

const debug = parentDebug.extend('syncUtils');

export function Uint8ArrayToHexString(data: Uint8Array): string {
  if (data.length === 0) return '0x00';
  let hex = data.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
  if (hex.substring(0, 2) == '0x') hex = hex.substring(2);
  const prefix = hex.length % 2 !== 0 ? '0x0' : '0x';
  return prefix + hex;
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
  const stateEntitiesHex = stateEntities.map((e) => Uint8ArrayToHexString(e) as EntityID);
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
      console.log(`[rpc] fetched ${events.length} events from block range ${from} -> ${to}`);

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
