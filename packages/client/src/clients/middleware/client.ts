import { createChannel, createClient } from 'nice-grpc-web';

import { log } from 'utils/logger';

import { getGrpcTransport } from '../../workers/sync/grpcTransport';
import { MiddlewareServiceClient, MiddlewareServiceDefinition } from './proto';
import { StreamCallbacks } from './subscriptions';

let Client: MiddlewareServiceClient | null = null;

export function getClient(): MiddlewareServiceClient | null {
  if (!import.meta.env.VITE_MIDDLEWARE_URL) {
    log.warn('[middleware] VITE_MIDDLEWARE_URL is not set, skipping middleware client');
    return null;
  }

  if (!Client) {
    log.info('[middleware] Creating client for', import.meta.env.VITE_MIDDLEWARE_URL);
    const channel = createChannel(import.meta.env.VITE_MIDDLEWARE_URL, getGrpcTransport());
    Client = createClient(MiddlewareServiceDefinition, channel);
  }
  return Client;
}

async function setupSubscription() {
  try {
    const stream = Client!.subscribeToStream({});

    for await (const response of stream) {
      StreamCallbacks.forEach((cb) => cb(response));
    }
  } catch (error) {
    console.error('[middleware] Stream error:', error);
    setTimeout(setupSubscription, 5000);
  }
}
