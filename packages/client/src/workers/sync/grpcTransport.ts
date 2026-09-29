import { grpc } from '@improbable-eng/grpc-web';

/**
 * gRPC-web transport for every browser.
 *
 * FetchReadableStreamTransport rides plain HTTP, so the browser negotiates
 * Accept-Encoding / Content-Encoding itself and the snapshot service's gzip
 * (kamigaze pkg/grpc/server.go withGzip) applies to the ~145MB cold GetState.
 * WebsocketTransport bypasses HTTP content-encoding entirely, so Chromium users
 * on it received the state uncompressed. All kamigaze/kamiden RPCs are
 * server-streaming only, which fetch supports; nothing needs WebSocket.
 */
export function getGrpcTransport(): grpc.TransportFactory {
  return grpc.FetchReadableStreamTransport({ credentials: 'omit' });
}

/**
 * Detects if the current browser is Safari or an iOS WebKit wrapper.
 * Used by the wallet connector and RPC provider setup to avoid WebKit
 * WebSocket quirks.
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
