import { log } from 'utils/logger';

export type GasCacheEntry = {
  gasLimit: bigint;
  timestamp: number;
  hitCount: number;
};

export type GasCacheConfig = {
  ttlMs?: number;
  bufferMultiplier?: number;
};

export class GasEstimationCache {
  private cache = new Map<string, GasCacheEntry>();
  private readonly ttlMs: number;
  private readonly bufferMultiplier: number;

  constructor(config: GasCacheConfig = {}) {
    this.ttlMs = config.ttlMs ?? 60 * 60 * 1000;
    this.bufferMultiplier = config.bufferMultiplier ?? 1.1;
  }

  /**
   * Generates a cache key
   * format:  {systemName}:{method}:{shape}[:{flags}]
   */
  generateKey(
    systemName: string,
    method: string,
    args: unknown[],
    options?: { taxEnabled?: boolean }
  ): string {
    const shape = args.map((arg) => this.normalizeArg(arg)).join(',');
    const taxFlag = options?.taxEnabled ? ':tax' : '';
    return `${systemName}:${method}:${shape}${taxFlag}`;
  }

  /**
   * Normalize argument to shape string.
   * - Arrays → "array:{length}"
   * - BigNumberish (bigint, number, numeric string) → "bigint"
   * - Other → typeof
   */
  private normalizeArg(arg: unknown): string {
    if (Array.isArray(arg)) {
      return `array:${arg.length}`;
    }

    switch (typeof arg) {
      case 'bigint':
      case 'number':
        return 'bigint';
      case 'string':
        return /^\d+$/.test(arg) ? 'bigint' : 'string';
      default:
        return typeof arg;
    }
  }

  get(key: string): bigint | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      log.debug(`[GasCache] TTL expired for ${key}`);
      return undefined;
    }

    entry.hitCount++;
    log.debug(`[GasCache] HIT ${key} (hits: ${entry.hitCount})`);
    return entry.gasLimit;
  }
  set(key: string, gasLimit: bigint): void {
    const bufferedGas = (gasLimit * BigInt(Math.floor(this.bufferMultiplier * 100))) / 100n;
    this.cache.set(key, {
      gasLimit: bufferedGas,
      timestamp: Date.now(),
      hitCount: 0,
    });
    log.debug(`[GasCache] SET ${key} = ${bufferedGas}`);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      log.debug(`[GasCache] INVALIDATED ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    log.debug('[GasCache] Cache cleared');
  }
  getStats(): { size: number; entries: Array<{ key: string; hits: number; age: number }> } {
    const now = Date.now();
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hitCount,
        age: now - entry.timestamp,
      })),
    };
  }
}
