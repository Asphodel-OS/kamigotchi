import { KamidenServiceClient, KamidenServiceDefinition } from 'engine/types/kamiden/kamiden';
import { createChannel, createClient } from 'nice-grpc-web';

let kamidenClient: KamidenServiceClient | null = null;

export function getKamidenClient(): KamidenServiceClient {
  if (!kamidenClient) {
    const channel = createChannel('localhost:50051');
    kamidenClient = createClient(KamidenServiceDefinition, channel);
  }
  return kamidenClient;
}
