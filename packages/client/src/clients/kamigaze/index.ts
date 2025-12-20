export { createKamigazeClient, getClient as getKamigazeClient } from './client';

export type {
  BlockRequest,
  BlockResponse,
  Component,
  ComponentsRequest,
  ComponentsResponse,
  DeepPartial,
  ECSEvent,
  EntitiesRequest,
  EntitiesResponse,
  Entity,
  GetEventsSinceRequest,
  GetEventsSinceResponse,
  KamigazeServiceClient,
  KamigazeServiceImplementation,
  MessageFns,
  ServerStreamingMethodResult,
  State,
  StateRequest,
  StateResponse,
  StreamRequest,
  StreamResponse,
  TxMetadata,
} from './proto';

export { KamigazeServiceDefinition as KamigazeServiceDefinition } from './proto';
