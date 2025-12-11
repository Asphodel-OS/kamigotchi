import { createChannel, createClient } from 'nice-grpc-web';

import { KamigazeServiceClient, KamigazeServiceDefinition } from 'engine/types/kamigaze/kamigaze';
import { getGrpcTransport } from '../grpcTransport';

// create a KamigazeServiceClient for the SnapshotService
export function create(url: string): KamigazeServiceClient {
  return createClient(KamigazeServiceDefinition, createChannel(url, getGrpcTransport()));
}
