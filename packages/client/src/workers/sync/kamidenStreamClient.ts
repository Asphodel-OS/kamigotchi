import { grpc } from '@improbable-eng/grpc-web';
import {
  KamidenServiceClient,
  KamidenServiceDefinition,
  Message,
} from 'engine/types/kamiden/kamiden';
import { createChannel, createClient } from 'nice-grpc-web';

let kamidenClient: KamidenServiceClient | null = null;
let messageCallbacks: ((message: Message) => void)[] = [];

export function getKamidenClient(): KamidenServiceClient {
  if (!kamidenClient) {
    const channel = createChannel(
      'http://localhost:80', //'https://kamiden-feed.test.asphodel.io',
      grpc.WebsocketTransport()
    );
    kamidenClient = createClient(KamidenServiceDefinition, channel);

    // Set up the perennial subscription
    setupMessageSubscription();
  }
  return kamidenClient;
}

// Subscribe to messages and notify all registered callbacks
async function setupMessageSubscription() {
  try {
    const stream = kamidenClient!.subscribeToStream({});

    for await (const response of stream) {
      for (const message of response.Messages) {
        messageCallbacks.forEach((callback) => callback(message));
      }
    }
  } catch (error) {
    console.error('[kamiden] Stream error:', error);
    // Attempt to reconnect after a delay
    setTimeout(setupMessageSubscription, 5000);
  }
}

export function subscribeToMessages(callback: (message: Message) => void) {
  messageCallbacks.push(callback);
  return () => {
    messageCallbacks = messageCallbacks.filter((cb) => cb !== callback);
  };
}
