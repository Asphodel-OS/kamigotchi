export { getClient as getMiddlewareClient } from './client';
export { subscribeToStream } from './subscriptions';

export type {
  ComponentValue,
  ECSEvent,
  EntityComponents,
  GetComponentValues,
  GetComponentValuesByType,
  GetComponentValuesByTypeRequest,
  GetComponentValuesByTypeResponse,
  GetComponentValuesRequest,
  GetComponentValuesResponse,
  MWResponse,
  StreamRequest,
  StreamResponse,
} from './proto';
