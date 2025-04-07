import { deferred } from 'utils/async';

const INDEXEDDB = self.indexedDB;
export const VERSION = 5;

/**
 * Initialize an indexedDB database.
 *
 * @param id Id of the database to initialize.
 * @param keys Keys of the storeKeys to initialize.
 * @param version Optional: version of the database to initialize.
 * @param idb Optional: custom indexedDB factory
 * @returns Promise resolving with IDBDatabase object
 */
export const initDb = (id: string, keys: string[], version = VERSION, idb = INDEXEDDB) => {
  const [resolve, reject, promise] = deferred<IDBDatabase>();

  const request = idb.open(id, version);

  // Create store and index when upgrade is needed
  request.onupgradeneeded = () => {
    console.warn(`IndexedDB ${id} upgrade needed to version ${version}`);
    const db = request.result;
    for (const key of keys) {
      if (!db.objectStoreNames.contains(key)) {
        db.createObjectStore(key);
      }
    }
  };

  // Resolve on success
  request.onsuccess = () => {
    const db = request.result;
    resolve(db);
  };

  // Reject on error
  request.onerror = (error) => {
    reject(new Error(JSON.stringify(error)));
  };

  return promise;
};
