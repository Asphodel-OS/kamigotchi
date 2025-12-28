import { createChannel, createClient } from 'nice-grpc-web';

import { getGrpcTransport } from '../../workers/sync/grpcTransport';
import { KamigazeServiceClient, KamigazeServiceDefinition } from './proto';

let Client: KamigazeServiceClient | null = null;

// Reuse clients by URL to avoid recreating channels on each call
const clientsByUrl = new Map<string, KamigazeServiceClient>();

/**
 * Get or create a KamigazeServiceClient for a given URL.
 * Clients are reused by URL to preserve gRPC channels across reconnections.
 */
export function createKamigazeClient(url: string): KamigazeServiceClient {
  const existing = clientsByUrl.get(url);
  if (existing) {
    return existing;
  }

  const channel = createChannel(url, getGrpcTransport());
  const client = createClient(KamigazeServiceDefinition, channel);
  clientsByUrl.set(url, client);
  return client;
}

/**
 * Get the singleton KamigazeServiceClient using the environment URL.
 * Returns null if VITE_KAMIGAZE_URL is not set.
 */
export function getClient(): KamigazeServiceClient | null {
  if (!import.meta.env.VITE_KAMIGAZE_URL) return Client; // null when kamigaze url is not set

  if (!Client) {
    Client = createKamigazeClient(import.meta.env.VITE_KAMIGAZE_URL);
  }
  return Client;
}
