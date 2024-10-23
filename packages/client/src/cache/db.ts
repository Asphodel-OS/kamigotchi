import { deferred } from 'utils/async';

const INDEXEDDB = self.indexedDB;
const VERSION = 2;

/**
 * Initialize an indexedDB database.
 *
 * @param dbId Id of the database to initialize.
 * @param storeKeys Keys of the storeKeys to initialize.
 * @param version Optional: version of the database to initialize.
 * @param idb Optional: custom indexedDB factory
 * @returns Promise resolving with IDBDatabase object
 */
export function initDb(dbId: string, storeKeys: string[], version = VERSION, idb = INDEXEDDB) {
  const [resolve, reject, promise] = deferred<IDBDatabase>();

  const request = idb.open(dbId, version);

  // Create store and index
  request.onupgradeneeded = () => {
    const db = request.result;

    for (const key of storeKeys) {
      if (!db.objectStoreNames.contains(key)) {
        db.createObjectStore(key);
      }
    }
  };

  request.onsuccess = () => {
    const db = request.result;
    resolve(db);
  };

  request.onerror = (error) => {
    reject(new Error(JSON.stringify(error)));
  };

  return promise;
}
