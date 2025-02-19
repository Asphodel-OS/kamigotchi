import { grpc } from '@improbable-eng/grpc-web';
import { createChannel, createClient } from 'nice-grpc-web';

import { Feed, KamidenServiceClient, KamidenServiceDefinition, Message } from './types';

let Client: KamidenServiceClient | null = null;
let messageCallbacks: ((message: Message) => void)[] = [];
let feedCallbacks: ((feed: Feed) => void)[] = [];

export function getClient(): KamidenServiceClient {
  if (!Client) {
    const channel = createChannel(
      'https://kamiden-feed.test.asphodel.io', //'http://localhost:80', //
      grpc.WebsocketTransport()
    );
    Client = createClient(KamidenServiceDefinition, channel);

    // Set up the perennial subscription
    setupMessageSubscription();
  }
  return Client;
}

// Subscribe to messages and notify all registered callbacks
async function setupMessageSubscription() {
  try {
    const stream = Client!.subscribeToStream({});

    for await (const response of stream) {
      // Handle messages
      for (const message of response.Messages) {
        messageCallbacks.forEach((callback) => callback(message));
      }

      // Handle feed if present
      if (response.Feed) {
        feedCallbacks.forEach((callback) => callback(response.Feed!));
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

export function subscribeToFeed(callback: (feed: Feed) => void) {
  feedCallbacks.push(callback);
  return () => {
    feedCallbacks = feedCallbacks.filter((cb) => cb !== callback);
  };
}
