import { fromEvent, map, Observable } from 'rxjs';
import { log } from 'utils/logger';

export interface DoWork<In, Out> {
  work(input$: Observable<In>): Observable<Out>;
}

export function fromWorker<In, Out>(worker: Worker, input$: Observable<In>): Observable<Out> {
  input$.subscribe((event) => worker.postMessage(event));
  return fromEvent<MessageEvent<Out>>(worker, 'message').pipe(map((e) => e.data));
}

export function runWorker<In, Out>(worker: DoWork<In, Out>) {
  log.info('[worker] started');
  const input$ = fromEvent<MessageEvent<In>>(self, 'message');
  const output$ = worker.work(input$.pipe(map((event) => event.data)));
  output$.subscribe((event) => self.postMessage(event));
}
