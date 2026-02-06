import { invalidateTempBonusesCache } from 'app/cache/bonus';
import { invalidateKamiAfterCast } from 'app/cache/kami';
import { KamiCast, subscribeToFeed } from 'clients/kamiden';
import { formatEntityID } from 'engine/utils';
import { NetworkLayer } from 'network/';
import { log } from 'utils/logger';

/**
 * Subscribes to the Kamiden KamiCasts feed and invalidates relevant caches
 * whenever ANY player casts an item on a Kami. This replaces manual invalidation
 * in UI components (e.g., CastItemButton) with a centralized, event-driven approach.
 */
export function setupCacheInvalidationHandler(network: NetworkLayer) {
  const { world } = network;

  return subscribeToFeed((feed) => {
    feed.KamiCasts.forEach((cast: KamiCast) => {
      const targetID = formatEntityID(cast.TargetID);
      const targetEntity = world.entityToIndex.get(targetID);
      if (targetEntity === undefined) return;

      log.debug(`CacheInvalidation: cast on entity ${targetEntity} (item ${cast.itemIndex})`);
      invalidateKamiAfterCast(targetEntity);
      invalidateTempBonusesCache(world, targetEntity);
    });
  });
}
