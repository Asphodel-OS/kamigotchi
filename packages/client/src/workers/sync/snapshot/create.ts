import { createKamigazeClient, KamigazeServiceClient } from 'clients/kamigaze';

// create a KamigazeServiceClient for the SnapshotService
export function create(url: string): KamigazeServiceClient {
  return createKamigazeClient(url);
}
