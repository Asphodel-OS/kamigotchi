import { formatEntityID } from 'engine/utils';

import { NetworkComponentUpdate } from 'workers/types';
import { WALK_IDS } from './walk';

export type RouteState = {
  accountId: string;
  // A ∪ K; SetAccount swaps it (and accountId) for the new player's walk
  playerIds: Set<string>;
  emittedEntities: Set<string>;
  // log events of entities unknown to canonical, kept only so a later link can flush them
  held: Map<string, NetworkComponentUpdate[]>;
  // entities created and linked to the player in the open tx, flushed once that tx closes
  ready: Set<string>;
  openTx?: string;
  isKnown: (entityId: string) => boolean;
  merged: boolean;
};

const LINKS = new Set(WALK_IDS.links);

const linkValue = (event: NetworkComponentUpdate) =>
  LINKS.has(event.component) ? (event.value as { value?: string } | undefined)?.value : undefined;

const isCreation = (event: NetworkComponentUpdate) =>
  event.component === WALK_IDS.EntityType && event.value != null;

const linksTo = (event: NetworkComponentUpdate, ids: Set<string>) => {
  const link = linkValue(event);
  return link != null && ids.has(link);
};

const closeTx = (s: RouteState) => {
  const flushed: NetworkComponentUpdate[] = [];
  for (const entity of s.ready) {
    flushed.push(...s.held.get(entity)!);
    s.held.delete(entity);
    s.emittedEntities.add(entity);
  }
  s.ready.clear();
  return flushed;
};

/**
 * Decides what to emit for a live event before the final merge. Returns the events to emit
 * now in log order ([] = hold); every event is also in the live log, so anything held is
 * emitted by the final merge.
 *
 * An entity unknown to canonical is flushed only when the log holds both its creation (an
 * EntityType set) and a link to the player, and only after the tx that made it so has
 * closed, so all of that tx's rows for it (e.g. a harvest's IdSource after its IdHolder) go
 * out together. "Unknown to canonical" alone is not enough: on warm boot canonical is an
 * older IDB save, so an entity created since has its creation rows in the gap/delta.
 *
 * A tx closes when an event of another tx arrives. lastEventInTx cannot mark it: kamigaze
 * streams one log per message and the transform sets it per message, so it is always true
 * on the gRPC stream. The last tx before a quiet stream therefore waits for the next event
 * or the final merge.
 *
 * Mutates s.
 */
export const routeLive = (event: NetworkComponentUpdate, s: RouteState) => {
  if (s.merged) return [event];
  const emit = event.txHash !== s.openTx ? closeTx(s) : [];
  s.openTx = event.txHash;

  const entity = formatEntityID(event.entity);
  if (s.emittedEntities.has(entity)) return [...emit, event];
  if (s.isKnown(entity)) return emit;

  const held = s.held.get(entity) ?? [];
  held.push(event);
  s.held.set(entity, held);
  if (!s.ready.has(entity) && held.some(isCreation) && held.some((e) => linksTo(e, s.playerIds))) {
    s.ready.add(entity);
    const ownedByAccount = (e: NetworkComponentUpdate) =>
      e.component === WALK_IDS.IDOwnsKami && linkValue(e) === s.accountId;
    if (held.some(ownedByAccount)) s.playerIds.add(entity);
  }
  return emit;
};
