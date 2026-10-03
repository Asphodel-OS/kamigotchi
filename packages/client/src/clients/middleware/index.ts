export { getClient as getMiddlewareClient } from './client';
export { subscribeToStream } from './subscriptions';

export type {
  ComponentValue,
  ECSEvent,
  EntityComponents,
  GetComponentValuesByTypeRequest,
  GetComponentValuesByTypeResponse,
  GetComponentValuesRequest,
  GetComponentValuesResponse,
  MWResponse,
  StreamRequest,
  StreamResponse,
} from './proto';
