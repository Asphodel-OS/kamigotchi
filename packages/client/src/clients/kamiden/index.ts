export { getClient as getKamidenClient } from './client';
export { subscribeToFeed, subscribeToMessages } from './subscriptions';

export type {
  AuctionBuy,
  AuctionBuysRequest,
  AuctionBuysResponse,
  Feed,
  Message,
  RoomRequest,
  RoomResponse,
  StreamRequest,
  StreamResponse,
} from './proto';
