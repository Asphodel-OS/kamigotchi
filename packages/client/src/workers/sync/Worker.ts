import { Components, ComponentValue, SchemaOf } from '@mud-classic/recs';
import {
  awaitStreamValue,
  DoWork,
  filterNullish,
  keccak256,
  streamToDefinedComputed,
} from '@mud-classic/utils';
import { computed } from 'mobx';
import {
  bufferTime,
  catchError,
  concat,
  concatMap,
  filter,
  ignoreElements,
  map,
  Observable,
  of,
  Subject,
  take,
} from 'rxjs';

import { GodID, SyncState, SyncStatus } from 'engine/constants';
import { createBlockNumberStream } from 'engine/executors';
import { createReconnectingProvider } from 'engine/providers';
import { debug as parentDebug } from '../debug';
import {
  isNetworkComponentUpdateEvent,
  NetworkComponentUpdate,
  NetworkEvent,
  NetworkEvents,
  SyncWorkerConfig,
} from '../types';
import {
  createCacheStore,
  getCacheStoreEntries,
  getIndexDBCacheStoreBlockNumber,
  getStateCache,
  loadIndexDbToCacheStore,
  saveCacheStoreToIndexDb,
  storeEvent,
  storeEvents,
} from './cache';
import {
  createLatestEventStreamService,
  createTransformWorldEventsFromStream,
} from './streamClient';
import {
  createDecode,
  createFetchSystemCallsFromEvents,
  createFetchWorldEventsInBlockRange,
  createLatestEventStreamRPC,
  createSnapshotClient,
  fetchEventsInBlockRangeChunked,
  fetchStateFromKamigaze,
} from './utils';

const debug = parentDebug.extend('SyncWorker');

export enum InputType {
  Ack,
  Config,
}
export type Config = { type: InputType.Config; data: SyncWorkerConfig };
export type Ack = { type: InputType.Ack };
export const ack = { type: InputType.Ack as const };
export type Input = Config | Ack;

export class SyncWorker<C extends Components> implements DoWork<Input, NetworkEvent<C>[]> {
  private input$ = new Subject<Input>();
  private output$ = new Subject<NetworkEvent<C>>();
  private syncState: SyncStatus = { state: SyncState.CONNECTING, msg: '', percentage: 0 };

  constructor() {
    debug('creating SyncWorker');
    this.init();
  }

  /**
   * Pass a loading state component update to the main thread.
   * Can be used to indicate the initial loading state on a loading screen.
   * @param loadingState {
   *  state: {@link SyncState},
   *  msg: Message to describe the current loading step.
   *  percentage: Number between 0 and 100 to describe the loading progress.
   * }
   * @param blockNumber Optional: block number to pass in the component update.
   */
  private setLoadingState(
    loadingState: Partial<{ state: SyncState; msg: string; percentage: number }>,
    blockNumber = 0
  ) {
    const newLoadingState = { ...this.syncState, ...loadingState };
    this.syncState = newLoadingState;
    const update: NetworkComponentUpdate<C> = {
      type: NetworkEvents.NetworkComponentUpdate,
      component: keccak256('component.LoadingState'),
      value: newLoadingState as unknown as ComponentValue<SchemaOf<C[keyof C]>>,
      entity: GodID,
      txHash: 'worker', // Q: would we benefit at all from modifying the txHash?
      lastEventInTx: false,
      blockNumber,
    };

    this.output$.next(update);
  }

  /**
   * Start the sync process.
   * 1. Get config
   * 2. Start the live sync from streamer/rpc
   * 3. Load historic state from snapshotter or indexdDB cache
   * 4. Fill the live-sync state gap since start
   * 5. Initialize world
   * 6. Keep in sync with streamer/rpc
   */
  private async init() {
    performance.mark('connecting');
    this.setLoadingState({ state: SyncState.CONNECTING, msg: 'Connecting..', percentage: 0 });

    // listen on input for the provided a config
    const computedConfig = await streamToDefinedComputed(
      this.input$.pipe(
        map((e) => (e.type === InputType.Config ? e.data : undefined)),
        filterNullish()
      )
    );
    const config = computedConfig.get();
    const {
      snapshotServiceUrl: snapshotUrl,
      streamServiceUrl,
      chainId,
      worldContract,
      provider: { options: providerOptions },
      initialBlockNumber,
      fetchSystemCalls,
      disableCache,
    } = config;

    // Set default values for config fields
    const cacheExpiry = config.cache?.expiry || 100;
    const cacheInterval = config.cache?.interval || 1;

    // Set up shared primitives
    performance.mark('setup');
    this.setLoadingState({
      state: SyncState.SETUP,
      msg: 'Starting State Sync',
      percentage: 0,
    });
    const { providers } = await createReconnectingProvider(
      computed(() => computedConfig.get().provider)
    );
    const provider = providers.get().json;
    const indexedDB = await getStateCache(chainId, worldContract.address);
    const decode = createDecode();
    const fetchWorldEvents = createFetchWorldEventsInBlockRange(
      provider,
      worldContract,
      providerOptions?.batch,
      decode
    );

    /*
     * START LIVE SYNC
     * - start syncing current events to reduce block gap
     * - only stream events to output after closing block gap
     * - use stream service if available, otherwise rawdog RPC
     */
    this.setLoadingState({
      state: SyncState.SETUP,
      msg: 'Initializing Event Streams',
      percentage: 0,
    });
    let outputLiveEvents = false;
    const cacheStore = { current: createCacheStore() };
    const { blockNumber$ } = createBlockNumberStream(providers);

    // Setup RPC event stream
    const latestEventRPC$ = createLatestEventStreamRPC(
      blockNumber$,
      fetchWorldEvents,
      fetchSystemCalls ? createFetchSystemCallsFromEvents(provider) : undefined
    );

    // Setup Stream Service -> RPC event stream fallback
    const transformWorldEvents = createTransformWorldEventsFromStream(decode);
    const latestEvent$ = streamServiceUrl
      ? createLatestEventStreamService(
          streamServiceUrl,
          worldContract.address,
          transformWorldEvents,
          Boolean(fetchSystemCalls)
        ).pipe(
          catchError((err) => {
            console.error('SyncWorker stream service error, falling back to RPC', err);
            return latestEventRPC$;
          })
        )
      : latestEventRPC$;

    const initialLiveEvents: NetworkComponentUpdate<Components>[] = [];
    latestEvent$.subscribe((event) => {
      // Ignore system calls during initial sync
      if (!outputLiveEvents) {
        if (isNetworkComponentUpdateEvent(event)) initialLiveEvents.push(event);
        return;
      }

      // Store cache to indexdb on each interval
      if (isNetworkComponentUpdateEvent(event)) {
        const { blockNumber } = event;
        const blockDiff = blockNumber - cacheStore.current.blockNumber;
        if (blockDiff > 1 && blockNumber % cacheInterval === 0) {
          saveCacheStoreToIndexDb(indexedDB, cacheStore.current);
        }
        storeEvent(cacheStore.current, event);
      }

      this.output$.next(event as NetworkEvent<C>);
    });
    const streamStartBlockNumberPromise = awaitStreamValue(blockNumber$);

    /*
     * LOAD INITIAL STATE (BACKFILL)
     * - use IndexedDB Storage state cache if not expired
     * - otherwise retrieve from snapshot service
     * TODO: support partial state retrieval and hybrid cache+snapshot state construction
     */
    performance.mark('backfill');
    this.setLoadingState({
      state: SyncState.BACKFILL,
      msg: 'Determining Sync Range',
      percentage: 0,
    });
    const cacheBlockNumber = !disableCache ? await getIndexDBCacheStoreBlockNumber(indexedDB) : -1;
    this.setLoadingState({ percentage: 50 });

    const kamigazeClient = createSnapshotClient(snapshotUrl);

    this.setLoadingState({ percentage: 100 });

    // KAMIGAZE INTEGRRATION
    let initialState = await loadIndexDbToCacheStore(indexedDB);
    // Load from cache if the snapshot is less than <cacheExpiry> blocks newer than the cache
    this.setLoadingState({
      msg: 'Fetching Initial State From Snapshot',
      percentage: 0,
    });
    console.log('CACHE STORE BEFORE SYNC <-----------------------');
    console.log('BlockNumber', initialState.blockNumber);
    console.log('Components', initialState.components.length);
    console.log('Entities', initialState.entities.length);
    console.log('StateValues', initialState.state.size);
    console.log('lastBlockFromKamigaze', initialState.lastKamigazeBlock);
    console.log('lastEntityFromKamigaze', initialState.lastKamigazeEntity);
    console.log('lastComponentFromKamigaze', initialState.lastKamigazeComponent);
    console.log('------------------------------------------------');

    // NOTE(🥕) On the older version using the snapshot service is not mandatory so it can do the sync block by block
    // I removed it here just to make sure Kamigaze is working as expected
    initialState = await fetchStateFromKamigaze(
      initialState,
      kamigazeClient,
      decode,
      config.snapshotNumChunks ?? 10,
      (percentage: number) => this.setLoadingState({ percentage })
    );
    console.log('CACHE STORE AFTER SYNC <------------------------');
    console.log('BlockNumber', initialState.blockNumber);
    console.log('Components', initialState.components.length);
    console.log('Entities', initialState.entities.length);
    console.log('StateValues', initialState.state.size);
    console.log('lastBlockFromKamigaze', initialState.lastKamigazeBlock);
    console.log('lastEntityFromKamigaze', initialState.lastKamigazeEntity);
    console.log('lastComponentFromKamigaze', initialState.lastKamigazeComponent);
    console.log('------------------------------------------------');

    /*
     * FILL THE GAP
     * - Load events between initial and recent state from RPC
     * Q: shouldnt we just launch the live sync down here if we're chunking it anyways
     */
    performance.mark('gapfill');
    const streamStartBlockNumber = await streamStartBlockNumberPromise;
    this.setLoadingState({
      state: SyncState.GAPFILL,
      msg: `Closing State Gap From Blocks ${initialState.blockNumber} to ${streamStartBlockNumber}`,
      percentage: 0,
    });

    const gapStateEvents = await fetchEventsInBlockRangeChunked(
      fetchWorldEvents,
      initialState.blockNumber,
      streamStartBlockNumber,
      50,
      (percentage: number) => this.setLoadingState({ percentage })
    );

    // Merge initial state, gap state and live events since initial sync started
    storeEvents(initialState, [...gapStateEvents, ...initialLiveEvents]);
    cacheStore.current = initialState;

    /*
     * INITIALIZE STATE
     * - Initialize the app state from the list of network events
     */
    performance.mark('init');
    const cacheStoreSize = cacheStore.current.state.size;
    this.setLoadingState({
      state: SyncState.INITIALIZE,
      msg: `Initializing with ${cacheStoreSize} state entries`,
      percentage: 0,
    });

    // Pass current cacheStore to output and start passing live events
    let i = 0;
    for (const update of getCacheStoreEntries(cacheStore.current)) {
      this.output$.next(update as NetworkEvent<C>);
      if (i++ % 5e4 === 0) {
        const percentage = Math.floor((i / cacheStoreSize) * 100);
        this.setLoadingState({ percentage });
      }
    }
    saveCacheStoreToIndexDb(indexedDB, cacheStore.current);

    /*
     * FINISH
     */
    performance.mark('live');
    this.setLoadingState(
      { state: SyncState.LIVE, msg: `Streaming Live Events`, percentage: 100 },
      cacheStore.current.blockNumber
    );

    // Q: how does this retroactively affects the Latest Event subscription?
    outputLiveEvents = true;

    performance.measure('connection', 'connecting', 'setup');
    performance.measure('setup', 'setup', 'backfill');
    performance.measure('backfill', 'backfill', 'gapfill');
    performance.measure('gapfill', 'gapfill', 'init');
    performance.measure('initialization', 'init', 'live');
    console.log(performance.getEntriesByType('measure'));
  }

  public work(input$: Observable<Input>): Observable<NetworkEvent<C>[]> {
    input$.subscribe(this.input$);
    const throttledOutput$ = new Subject<NetworkEvent<C>[]>();

    this.output$
      .pipe(
        bufferTime(16, null, 50),
        filter((updates) => updates.length > 0),
        concatMap((updates) =>
          concat(
            of(updates),
            input$.pipe(
              filter((e) => e.type === InputType.Ack),
              take(1),
              ignoreElements()
            )
          )
        )
      )
      .subscribe(throttledOutput$);

    return throttledOutput$;
  }
}
