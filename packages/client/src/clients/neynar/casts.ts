import { FeedResponse, OperationResponse } from '@neynar/nodejs-sdk/build/neynar-api/v2';
import { client } from './auth';

export async function pollChannelCasts(
  channel: string,
  cursor?: string,
  limit?: number
): Promise<FeedResponse> {
  const response = await client.fetchFeed('filter', {
    filterType: 'channel_id',
    channelId: channel,
    cursor: cursor ?? '',
    limit: limit ?? 10, // defaults to 25, max 100
  });
  return response;
}

// likes a cast identified by the hash, as the user identified by the uuid
export async function likeCast(uuid: string, hash: string): Promise<OperationResponse> {
  return await client.publishReactionToCast(uuid, 'like', hash);
}

// unlikes a cast identified by the hash, as the user identified by the uuid
export async function unlikeCast(uuid: string, hash: string): Promise<OperationResponse> {
  return await client.deleteReactionFromCast(uuid, 'like', hash);
}
