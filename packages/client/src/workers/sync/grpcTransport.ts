import { grpc } from '@improbable-eng/grpc-web';

/**
 * gRPC-web transport for all browsers.
 * Fetch multiplexes every RPC onto the browser's existing HTTP/2 connection;
 * the WebSocket transport opened a fresh TCP+TLS handshake per call.
 */
export function getGrpcTransport(): grpc.TransportFactory {
  return grpc.FetchReadableStreamTransport({ credentials: 'omit' });
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