export { createKamigazeClient, getClient as getKamigazeClient } from './client';

export type {
  BlockRequest,
  BlockResponse,
  Component,
  ComponentsRequest,
  DeepPartial,
  ECSEvent,
  EntitiesRequest,
  Entity,
  GetEventsSinceRequest,
  GetEventsSinceResponse,
  KamigazeServiceClient,
  KamigazeServiceImplementation,
  MessageFns,
  ServerStreamingMethodResult,
  State,
  StateRequest,
  StreamRequest,
  StreamResponse,
  TxMetadata,
} from './proto';

export {
  ComponentsResponse,
  EntitiesResponse,
  KamigazeServiceDefinition,
  StateResponse,
} from './proto';
