import { EntityID } from '@mud-classic/recs';
import { getKamidenClient, Kill } from 'clients/kamiden';

export const BattleCache = new Map<EntityID, Kill[]>();
const BattleClient = getKamidenClient();

export const get = async (kamiId: EntityID, append: boolean) => {
  if (!BattleCache.has(kamiId) || append) await process(kamiId);
  return BattleCache.get(kamiId)!;
};

export const process = async (kamiId: EntityID) => {
  if (!BattleClient) {
    console.warn('process(): Kamiden client not initialized');
    BattleCache.set(kamiId, []);
    return;
  }
  const existingKills: Kill[] = BattleCache.get(kamiId) ?? [];
  const lastTs = existingKills[existingKills.length - 1]?.Timestamp ?? Date.now();
  const kamiStr = BigInt(kamiId).toString();
  const response = await BattleClient.getBattles({
    KillerId: kamiStr,
    VictimId: kamiStr,
    Timestamp: lastTs,
  });
  BattleCache.set(kamiId, existingKills.concat(response.Kills));
};

export const push = (kill: Kill) => {
  var kamiKills = BattleCache.get(kill.KillerId as EntityID);
  var kamiVictim = BattleCache.get(kill.VictimId as EntityID);
  if (kamiKills) {
    BattleCache.set(kill.KillerId as EntityID, kamiKills.concat(kill));
  }
  if (kamiVictim) {
    BattleCache.set(kill.VictimId as EntityID, kamiVictim.concat(kill));
  }
};
