import { grpc } from '@improbable-eng/grpc-web';

/**
 * Returns the appropriate gRPC transport based on browser
 * - FetchReadableStreamTransport for Safari/iOS (WebKit WebSocket bugs in workers)
 * - WebsocketTransport for Chromium-based browsers
 */
export function getGrpcTransport(): grpc.TransportFactory {
  if (isSafariOrIOS()) {
    console.log('[grpc] Using FetchReadableStreamTransport for Safari/iOS');
    return grpc.FetchReadableStreamTransport({ credentials: 'omit' });
  }

  console.log('[grpc] Using WebsocketTransport');
  return grpc.WebsocketTransport();
}

/**
 * Detects if the current browser is Safari or an iOS WebKit wrapper.
 * Needed because WebKit's WebSocket implementation inside workers is unreliable.
 */
export function isSafariOrIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  return isSafari || isIOS;
}