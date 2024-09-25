export {
  createCacheStore,
  getCacheStoreEntries,
  getIndexDBCacheStoreBlockNumber,
  getStateCache,
  loadIndexDbCacheStore,
  saveCacheStoreToIndexDb,
  storeEvent,
  storeEvents,
} from './CacheStore';
export type { CacheStore, ECSCache, State } from './CacheStore';

export { initCache } from './initCache';
