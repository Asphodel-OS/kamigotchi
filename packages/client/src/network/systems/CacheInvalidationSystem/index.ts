import { invalidateTempBonusesCache } from 'app/cache/bonus';
import { invalidateKamiAfterCast, invalidateKamiAfterKill } from 'app/cache/kami';
import { KamiCast, Kill, subscribeToFeed } from 'clients/kamiden';
import { formatEntityID } from 'engine/utils';
import { NetworkLayer } from 'network/';
import { log } from 'utils/logger';

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

    feed.Kills.forEach((kill: Kill) => {
      const killerID = formatEntityID(kill.KillerId);
      const victimID = formatEntityID(kill.VictimId);

      const killerEntity = world.entityToIndex.get(killerID);
      const victimEntity = world.entityToIndex.get(victimID);

      if (killerEntity !== undefined) {
        log.debug(`CacheInvalidation: killer ${killerEntity}`);
        invalidateKamiAfterKill(killerEntity);
        invalidateTempBonusesCache(world, killerEntity);
      }

      if (victimEntity !== undefined) {
        log.debug(`CacheInvalidation: victim ${victimEntity}`);
        invalidateKamiAfterKill(victimEntity);
        invalidateTempBonusesCache(world, victimEntity);
      }
    });
  });
}
