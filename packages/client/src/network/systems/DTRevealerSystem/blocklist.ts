import { EntityID } from 'engine/recs';

// empty since chunked reveals landed: previously held two oversized commits
// that reverted every reveal. repopulate only if a commit gets stuck in a way
// the chunked drain cannot recover
const BLOCKED_REVEAL_COMMIT_IDS = new Set<string>([]);

const normalizeCommitId = (id: EntityID): string => {
  const res = String(id).trim();
  return /^0x[0-9a-f]+$/i.test(res) ? BigInt(res).toString(10) : res;
};

export const isBlockedRevealCommitID = (id: EntityID): boolean =>
  BLOCKED_REVEAL_COMMIT_IDS.has(normalizeCommitId(id));
