import { deferred } from 'utils/async';
import { arrayToIterator, mergeIterators, transformIterator } from 'utils/iterators';
import { initDb } from './db';

type Stores = { [key: string]: unknown };
type StoreKey<S extends Stores> = keyof S & string;

/**
 * Initialize an abstracted Cache object to simplify interaction with the indexedDB database.
 *
 * @param id Id of the database to initialize.
 * @param stores Keys of the stores to initialize.
 * @param version Optional: version of the database to initialize.
 * @param idb Optional: custom indexedDB factory
 * @returns Promise resolving with Cache object
 */
export async function initCache<S extends Stores>(
  id: string,
  stores: StoreKey<S>[],
  version?: number,
  idb?: IDBFactory
) {
  const db = await initDb(id, stores, version, idb);

  /**
   * retrieve a store
   *
   * @param store the key of the desired store
   */
  function openStore(store: StoreKey<S>): IDBObjectStore {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    return objectStore;
  }

  /**
   * set a value in a store
   *
   * @param store the key of the desired store
   * @param key the key of the desired value
   * @param value the value to set
   * @param ignoreResult (optional) whether to ignore the operation result
   * @returns Promise resolving when the value is set
   */
  function set<Store extends StoreKey<S>>(
    store: Store,
    key: string,
    value: S[Store],
    ignoreResult = false
  ) {
    const objectStore = openStore(store);
    const request = objectStore.put(value, key);

    if (ignoreResult) return;

    const [resolve, reject, promise] = deferred<void>();

    request.onerror = (error) => {
      reject(new Error(JSON.stringify(error)));
    };

    request.onsuccess = () => {
      resolve();
    };

    return promise;
  }

  /**
   * get a value from a store
   *
   * @param store the key of the desired store
   * @param key the key of the desired value
   * @returns Promise resolving to the value at the key
   */
  function get<Store extends StoreKey<S>>(
    store: Store,
    key: string
  ): Promise<S[Store] | undefined> {
    const [resolve, reject, promise] = deferred<S[Store] | undefined>();

    const objectStore = openStore(store);
    const request = objectStore.get(key);

    request.onerror = (error) => {
      reject(new Error(JSON.stringify(error)));
    };

    request.onsuccess = () => {
      const item = request.result;
      resolve(item);
    };

    return promise;
  }

  /**
   * remove a value from a store
   *
   * @param store the key of the desired store
   * @param key the key of the desired value
   * @returns Promise resolving when the value is removed
   */
  function remove(store: StoreKey<S>, key: string): Promise<void> {
    const [resolve, reject, promise] = deferred<void>();

    const objectStore = openStore(store);
    const request = objectStore.delete(key);

    request.onerror = (error) => {
      reject(new Error(JSON.stringify(error)));
    };

    request.onsuccess = () => {
      resolve();
    };

    return promise;
  }

  /**
   * get all keys within a store
   *
   * @param store the key of the desired store
   * @returns Promise resolving to iterator of keys within the store
   */
  function keys(store: StoreKey<S>): Promise<IterableIterator<string>> {
    const [resolve, reject, promise] = deferred<IterableIterator<string>>();

    const objectStore = openStore(store);
    const request = objectStore.getAllKeys();

    request.onerror = (error) => {
      reject(new Error(JSON.stringify(error)));
    };

    request.onsuccess = () => {
      const rawKeys = arrayToIterator(request.result);
      const stringKeys = transformIterator(rawKeys, (k) => k.toString());
      resolve(stringKeys);
    };

    return promise;
  }

  /**
   * get all values within a store
   *
   * @param store the key of the desired store
   * @returns Promise resolving to iterator of values within the store
   */
  function values<Store extends StoreKey<S>>(store: Store): Promise<IterableIterator<S[Store]>> {
    const [resolve, reject, promise] = deferred<IterableIterator<S[Store]>>();

    const objectStore = openStore(store);
    const request = objectStore.getAll();

    request.onerror = (error) => {
      reject(new Error(JSON.stringify(error)));
    };

    request.onsuccess = () => {
      resolve(arrayToIterator(request.result));
    };

    return promise;
  }

  /**
   * get all entries within a store
   *
   * @param store the key of the desired store
   * @returns Promise resolving to iterator of [key, value] entries within the store
   */
  async function entries<Store extends StoreKey<S>>(
    store: Store
  ): Promise<IterableIterator<[string, S[Store]]>> {
    const [keyIterator, valueIterator] = await Promise.all([keys(store), values(store)]);
    return mergeIterators(keyIterator, valueIterator);
  }

  return { set, get, remove, keys, values, entries, db };
}
