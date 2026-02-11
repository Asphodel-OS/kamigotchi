export { getClient as getKamidenClient } from './client';
export { subscribeToFeed, subscribeToMessages } from './subscriptions';
export { logTxError } from './txErrorLogger';

export type {
  AuctionBuy,
  AuctionBuysRequest,
  AuctionBuysResponse,
  DroptableReveal,
  Feed,
  HarvestEnd,
  KamiCast,
  Kill,
  Message,
  Movement,
  RoomRequest,
  RoomResponse,
  SacrificeReveal,
  StreamRequest,
  StreamResponse,
} from './proto';
