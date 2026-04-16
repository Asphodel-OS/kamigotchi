import { EntityID } from 'engine/recs';

const BLOCKED_REVEAL_COMMIT_IDS = new Set<string>([
  '3572523974092509234678502131021303027074615784884451735238572498525911350024',
  '48679967222604168909649595373561210760367144720897375088563730130200347959718',
]);

const normalizeCommitId = (id: EntityID): string => {
  const res = String(id).trim();
  return /^0x[0-9a-f]+$/i.test(res) ? BigInt(res).toString(10) : res;
};

export const isBlockedRevealCommitID = (id: EntityID): boolean =>
  BLOCKED_REVEAL_COMMIT_IDS.has(normalizeCommitId(id));
