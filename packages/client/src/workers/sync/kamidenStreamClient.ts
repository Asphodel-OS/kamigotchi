import { grpc } from '@improbable-eng/grpc-web';
import { KamidenServiceClient, KamidenServiceDefinition } from 'engine/types/kamiden/kamiden';
import { createChannel, createClient } from 'nice-grpc-web';

let kamidenClient: KamidenServiceClient | null = null;

export function getKamidenClient(): KamidenServiceClient {
  if (!kamidenClient) {
    const channel = createChannel('http://127.0.0.1', grpc.WebsocketTransport()); //http client
    kamidenClient = createClient(KamidenServiceDefinition, channel);
  }
  return kamidenClient;
}
