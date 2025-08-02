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
  concat,
  concatMap,
  filter,
  ignoreElements,
  map,
  Observable,
  of,
  retry,
  Subject,
  Subscription,
  take,
  throwError,
  timeout,
  timer,
} from 'rxjs';

import { VERSION as IDB_VERSION } from 'cache/db';
import { GodID, SyncState, SyncStatus } from 'engine/constants';
import { createDecode } from 'engine/encoders';
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
import { createSnapshotClient, fetchSnapshot, isRateLimited } from './snapshot';
import {
  createStateCache,
  getStateCacheEntries,
  getStateReport,
  getStateStore,
  loadStateCacheFromStore,
  saveStateCacheToStore,
  storeStateEvents,
} from './state';
import { connectStreamService, createTransformWorldEvents } from './stream';
import {
  createFetchSystemCallsFromEvents,
  createFetchWorldEventsInBlockRange,
  createLatestEventStreamRPC,
  fetchEventsInBlockRangeChunked,
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
  private setLoadingState(loadingState: Partial<SyncStatus>, blockNumber = 0) {
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
      fetchSystemCalls,
    } = config;

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
    const indexedDB = await getStateStore(chainId, worldContract.address, IDB_VERSION);
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
    const stateCache = { current: createStateCache() };
    const { blockNumber$ } = createBlockNumberStream(providers);

    // Setup RPC event stream
    const latestEventRPC$ = createLatestEventStreamRPC(
      blockNumber$,
      fetchWorldEvents,
      fetchSystemCalls ? createFetchSystemCallsFromEvents(provider) : undefined
    );
    let currentSubscription: Subscription;
    // Setup Stream Service -> RPC event stream fallback
    const transformWorldEvents = createTransformWorldEvents(decode);
    let latestEvent$ = streamServiceUrl
      ? connectStreamService(
          streamServiceUrl,
          worldContract.address,
          transformWorldEvents,
          Boolean(fetchSystemCalls),
          fetchWorldEvents
        )
      : latestEventRPC$;

    // Create the new event stream upon failure
    const handleStreamReconnection = () => {
      console.log('[worker] handleEventStreamError');
      latestEvent$ = streamServiceUrl
        ? connectStreamService(
            streamServiceUrl,
            worldContract.address,
            transformWorldEvents,
            Boolean(fetchSystemCalls),
            fetchWorldEvents
          )
        : latestEventRPC$;
      if (currentSubscription) currentSubscription.unsubscribe();
      // Restart the subscription
      currentSubscription.unsubscribe();
      currentSubscription = subscribeToEventStream(latestEvent$);
    };

    const initialLiveEvents: NetworkComponentUpdate<Components>[] = [];
    const subscribeToEventStream = (stream$: Observable<any>): Subscription => {
      console.log('[worker] Subscribing to the event stream');
      return stream$
        .pipe(
          timeout({
            first: 60000, // Align with cloufront timeout/iddling
            each: 60000,
            with: () =>
              throwError(() => {
                console.log('Timeout');
                return new Error('Stream timeout - no data received for 60s');
              }),
          }),
          map((res) => res),
          retry({
            count: 3,
            delay: (error, retryCount) => {
              console.log(`retrying kamigaze stream subscription... ${retryCount}`);
              const delayMs = 3000;
              return timer(delayMs);
            },
          })
        )
        .subscribe({
          next: (event) => {
            if (event.component === 'Void') return;
            if (!outputLiveEvents) {
              if (isNetworkComponentUpdateEvent(event)) initialLiveEvents.push(event);
              return;
            }
            this.output$.next(event as NetworkEvent<C>); //this is the sync magic
          },
          error: (error) => {
            console.log(`[worker] error, attempting to re-subscribe to stream ${error}`, error);
            handleStreamReconnection();
          },
          complete: () => {
            console.log('[worker] stream completed');
            handleStreamReconnection();
          },
        });
    };
    currentSubscription = subscribeToEventStream(latestEvent$);

    const streamStartBlockNumberPromise = awaitStreamValue(blockNumber$);

    /*
     * LOAD INITIAL STATE (BACKFILL)
     * - use IndexedDB Storage state cache if not expired
     * - otherwise retrieve from snapshot service
     * TODO: support partial state retrieval and hybrid cache+snapshot state construction
     */
    performance.mark('backfill');
    this.setLoadingState({ state: SyncState.BACKFILL, percentage: 0 });

    // load cache
    this.setLoadingState({ msg: 'Loading State Cache', percentage: 0 });
    let initialState = await loadStateCacheFromStore(indexedDB);
    console.log('INITIAL STATE (PRE-SYNC)', getStateReport(initialState));

    // retrieve snapshot if url provided
    // TODO: include a liveness check on the snapshot
    if (snapshotUrl) {
      this.setLoadingState({ msg: 'Querying for Partial Snapshot', percentage: 0 });
      const kamigazeClient = createSnapshotClient(snapshotUrl);

      try {
        initialState = await fetchSnapshot(
          initialState,
          kamigazeClient,
          decode,
          config.snapshotNumChunks ?? 10,
          (percentage: number) => this.setLoadingState({ percentage })
        );
      } catch (e) {
        console.log(snapshotUrl);
        var errorMessage: string;

        if (await isRateLimited(snapshotUrl, e)) {
          errorMessage = "You're refreshing too much! Try again in a minute or two";
        } else {
          errorMessage = `Unknown error: ${e.code}. Can you drop this in the discord if it persists?`;
        }
        console.error('failed to retrieve state', e);
        this.setLoadingState({
          state: SyncState.FAILED,
          msg: errorMessage,
        });
        return;
      }
      this.setLoadingState({ percentage: 100 }); // move % updates into fetchSnapshot
      console.log('INTIAL STATE (POST-SYNC)', getStateReport(initialState));
    }

    /*
     * FILL THE GAP
     * - Load events between initial and recent state from RPC
     * Q: shouldnt we just launch the live sync down here if we're chunking it anyways
     */
    performance.mark('gapfill');
    const streamStartBlockNumber = await streamStartBlockNumberPromise;
    const startString = initialState.blockNumber.toLocaleString();
    const endString = streamStartBlockNumber.toLocaleString();
    this.setLoadingState({
      state: SyncState.GAPFILL,
      msg: `Closing State Gap From Blocks ${startString} to ${endString}`,
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
    storeStateEvents(initialState, [...gapStateEvents, ...initialLiveEvents]);
    stateCache.current = initialState;

    /*
     * INITIALIZE STATE
     * - Initialize the app state from the list of network events
     */
    performance.mark('init');
    const stateCacheSize = stateCache.current.state.size;
    this.setLoadingState({
      state: SyncState.INITIALIZE,
      msg: `Initializing with ${stateCacheSize.toLocaleString()} state entries`,
      percentage: 0,
    });

    // Pass current stateCache to output and start passing live events
    let i = 0;
    for (const update of getStateCacheEntries(stateCache.current)) {
      this.output$.next(update as NetworkEvent<C>);
      if (i++ % 5e4 === 0) {
        const percentage = Math.floor((i / stateCacheSize) * 100);
        this.setLoadingState({ percentage });
      }
    }
    saveStateCacheToStore(indexedDB, stateCache.current);

    /*
     * FINISH
     */
    performance.mark('live');
    this.setLoadingState(
      { state: SyncState.LIVE, msg: `Streaming Live Events`, percentage: 100 },
      stateCache.current.blockNumber
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
        bufferTime(33, null, 33333),
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
