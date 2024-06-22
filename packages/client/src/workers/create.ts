import { Components } from '@mud-classic/recs';
import { map, Observable, Subject, timer } from 'rxjs';

import { fromWorker } from 'workers/utils';
import { Ack, ack, Input } from './sync/Worker';
import { NetworkEvent } from './types';

/**
 * Create a new SyncWorker ({@link Sync.worker.ts}) to performn contract/client state sync.
 * The main thread and worker communicate via RxJS streams.
 *
 * @returns Object {
 * ecsEvent$: Stream of network component updates synced by the SyncWorker,
 * config$: RxJS subject to pass in config for the SyncWorker,
 * dispose: function to dispose of the sync worker
 * }
 */
export function createSyncWorker<C extends Components = Components>(ack$?: Observable<Ack>) {
  const input$ = new Subject<Input>();
  const worker = new Worker(new URL('./sync/Sync.worker.ts', import.meta.url), {
    type: 'module',
  });
  const ecsEvents$ = new Subject<NetworkEvent<C>[]>();

  // Send ack every 16ms if no external ack$ is provided
  ack$ = ack$ || timer(0, 16).pipe(map(() => ack));
  const ackSub = ack$.subscribe(input$);

  // Pass in a "config stream", receive a stream of ECS events
  const subscription = fromWorker<Input, NetworkEvent<C>[]>(worker, input$).subscribe(ecsEvents$);
  const dispose = () => {
    worker.terminate();
    subscription?.unsubscribe();
    ackSub?.unsubscribe();
  };

  return {
    ecsEvents$,
    input$,
    dispose,
  };
}
