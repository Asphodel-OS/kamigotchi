import { grpc } from '@improbable-eng/grpc-web';
import { Channel, createChannel, createClient } from 'nice-grpc-web';

import { KamigazeServiceClient, KamigazeServiceDefinition } from 'engine/types/kamigaze/kamigaze';
import { debug as parentDebug } from '../../debug';

const debug = parentDebug.extend('syncUtils');

let client: KamigazeServiceClient;
let channel: Channel;

// create and return a kamigaze service client with a channel connection
export const create = (url: string): KamigazeServiceClient => {
  if (client) destroy();
  console.log('[kamigaze] creating stream client');
  channel = createChannel(url, grpc.WebsocketTransport());
  client = createClient(KamigazeServiceDefinition, channel);
  return client;
};

// Q: don't we want to destroy this client instance a bit more properly?
export const destroy = () => {
  debug('[kamigaze] closing stream connection');
  channel = null as any;
  client = null as any;
};
