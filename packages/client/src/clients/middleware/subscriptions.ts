import { StreamResponse } from './proto';

type StreamCallback = (response: StreamResponse) => void;

export const StreamCallbacks: StreamCallback[] = [];

export function subscribeToStream(callback: StreamCallback) {
  StreamCallbacks.push(callback);
  const cleanup = () => {
    const index = StreamCallbacks.indexOf(callback);
    if (index > -1) StreamCallbacks.splice(index, 1);
  };
  return cleanup;
}
