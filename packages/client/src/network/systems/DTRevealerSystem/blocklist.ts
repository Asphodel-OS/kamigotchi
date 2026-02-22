import { EntityID } from 'engine/recs';

const BLOCKED_REVEAL_COMMIT_IDS = new Set<string>([
  '3572523974092509234678502131021303027074615784884451735238572498525911350024',
]);

const normalizeCommitId = (id: EntityID): string => {
  let res = String(id).trim();
  if (/^0x[0-9a-f]+$/i.test(res)) res = BigInt(res).toString(10);
  console.log(`revealer: normalized to ${res}`);

  return res;
};

export const isBlockedRevealCommitID = (id: EntityID): boolean =>
  BLOCKED_REVEAL_COMMIT_IDS.has(normalizeCommitId(id));
