export { getClient as getKamidenClient } from './client';
export { subscribeToFeed, subscribeToMessages } from './subscriptions';

export type {
  AuctionBuy,
  AuctionBuysRequest,
  AuctionBuysResponse,
  Feed,
  HarvestEnd,
  KamiCast,
  Kill,
  Message,
  Movement,
  RoomRequest,
  RoomResponse,
  StreamRequest,
  StreamResponse,
} from './proto';
