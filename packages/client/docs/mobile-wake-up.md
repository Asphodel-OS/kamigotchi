# Mobile Wake-Up Speed Improvement

## Problem

When a user backgrounds the app on mobile (switches to another app, locks screen, etc.), the WebSocket/gRPC connection to the Kamigaze streaming service dies silently. When the user returns to the app:

1. The stream has a **10.1 second timeout** before detecting the dead connection
2. After timeout, Fibonacci retry adds additional delay (1s, 1s, 2s, 3s, 5s...)
3. **Result**: User waits 10+ seconds before reconnection even starts

The root cause was that **no visibility change detection existed** - the app had no way to know it was backgrounded/foregrounded.

## Solution

Add `visibilitychange` event listener to immediately trigger stream reconnection when the app becomes visible, bypassing the 10.1s timeout.

## Implementation

### 1. Worker.ts - New Wake Message Type

Added a new `Wake` input type that the main thread can send to the worker:

```typescript
export enum InputType {
  Ack,
  Config,
  Wake,  // NEW
}

export type Wake = { type: InputType.Wake };
export const wake = { type: InputType.Wake as const };
export type Input = Config | Ack | Wake;
```

Added a `wakeSignal$` Subject to the SyncWorker class that broadcasts wake events to the stream:

```typescript
private wakeSignal$ = new Subject<void>();
```

When the worker receives a Wake message, it forwards it to the stream:

```typescript
if (e.type === InputType.Wake) {
  console.log('[SyncWorker] Wake signal received');
  this.wakeSignal$.next();
  return;
}
```

The `wakeSignal$` is passed to `createStream()` so the stream can react to it.

### 2. stream.ts - Wake Signal Handling

Added `wakeSignal$` to StreamOptions:

```typescript
export interface StreamOptions {
  // ... existing options
  wakeSignal$?: Subject<void>;
}
```

Modified `createStream()` to wrap the raw stream in an Observable that:
- Subscribes to the wake signal
- When wake signal fires, immediately throws an error (forcing reconnection)
- On retry, checks if error was from wake signal and retries with **zero delay**

```typescript
return new Observable<NetworkEvent>((subscriber) => {
  // Subscribe to wake signal
  const wakeSub = wakeSignal$?.subscribe(() => {
    console.log('[kamigaze] Wake signal received, forcing reconnection');
    subscriber.error(new Error('Wake signal - forcing reconnection'));
  });

  // ... inner stream subscription

  return () => {
    wakeSub?.unsubscribe();
    innerSub.unsubscribe();
  };
}).pipe(
  retry({
    delay: (error, retryCount) => {
      // Immediate retry on wake signal (no delay!)
      if (error.message?.includes('Wake signal')) {
        console.log('[kamigaze] Immediate retry due to wake signal');
        return timer(0);
      }
      // Normal Fibonacci delay for other errors
      return timer(getFibonacciDelay(retryCount));
    },
  })
);
```

### 3. create.ts - Visibility Change Listener

Added visibility change detection in the main thread:

```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    console.log('[SyncWorker] App became visible, sending wake signal');
    input$.next(wake);
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
```

Added cleanup in `dispose()`:

```typescript
const dispose = () => {
  // ... existing cleanup
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }
};
```

## Flow Diagram

```
BEFORE (10+ seconds to reconnect):
┌─────────────────────────────────────────────────────────────────┐
│ User backgrounds app                                            │
│     ↓                                                           │
│ WebSocket/gRPC connection dies silently                         │
│     ↓                                                           │
│ User opens app again                                            │
│     ↓                                                           │
│ Stream waits for timeout... (10.1 seconds)                      │
│     ↓                                                           │
│ Timeout fires, retry with Fibonacci delay (1s, 1s, 2s...)       │
│     ↓                                                           │
│ Reconnection starts (~11+ seconds later)                        │
└─────────────────────────────────────────────────────────────────┘

AFTER (immediate reconnect):
┌─────────────────────────────────────────────────────────────────┐
│ User backgrounds app                                            │
│     ↓                                                           │
│ WebSocket/gRPC connection dies silently                         │
│     ↓                                                           │
│ User opens app again                                            │
│     ↓                                                           │
│ visibilitychange fires → document.visibilityState === 'visible' │
│     ↓                                                           │
│ Main thread sends Wake message to worker                        │
│     ↓                                                           │
│ Worker calls wakeSignal$.next()                                 │
│     ↓                                                           │
│ Stream throws error immediately (bypasses 10.1s timeout)        │
│     ↓                                                           │
│ Retry with delay=0 → immediate reconnection                     │
│     ↓                                                           │
│ Gap-fill runs, user sees updated state (~0-1 seconds)           │
└─────────────────────────────────────────────────────────────────┘
```

## Files Modified

| File | Changes |
|------|---------|
| `src/workers/sync/Worker.ts` | Added `Wake` InputType, `wakeSignal$` Subject, handler in `work()` |
| `src/workers/sync/stream/stream.ts` | Added `wakeSignal$` to options, wrapped stream to handle wake |
| `src/workers/create.ts` | Added `visibilitychange` listener, cleanup in dispose |

## Console Logs

When the wake-up flow triggers, you'll see these logs in order:

```
[SyncWorker] App became visible, sending wake signal
[SyncWorker] Wake signal received
[kamigaze] Wake signal received, forcing reconnection
[kamigaze] Immediate retry due to wake signal
[gapfill] Trying Kamigaze getEventsSince from block X...
[gapfill] Got Y events from Kamigaze
```
