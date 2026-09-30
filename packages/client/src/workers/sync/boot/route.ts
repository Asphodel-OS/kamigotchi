import { formatEntityID } from 'engine/utils';

import { StateEvent } from '../state/types';
import { WALK_IDS } from './walk';

export type RouteState = {
  accountId: string;
  // A ∪ K; SetAccount swaps it (and accountId) for the new player's walk
  playerIds: Set<string>;
  emittedEntities: Set<string>;
  // log events of entities unknown to canonical, kept only so a later link can flush them
  held: Map<string, StateEvent[]>;
  isKnown: (entityId: string) => boolean;
  merged: boolean;
};

const LINKS = new Set(WALK_IDS.links);

const linkValue = (event: StateEvent) =>
  LINKS.has(event.component) ? (event.value as { value?: string } | undefined)?.value : undefined;

const isCreation = (event: StateEvent) =>
  event.component === WALK_IDS.EntityType && event.value != null;

const linksTo = (event: StateEvent, ids: Set<string>) => {
  const link = linkValue(event);
  return link != null && ids.has(link);
};

/**
 * Decides what to emit for a live event before the final merge. Returns the events to emit
 * now in log order ([] = hold); every event is also in the live log, so anything held is
 * emitted by the final merge.
 *
 * An entity is flushed only once the log holds both its creation (an EntityType set) and a
 * link to the player: then all its rows are in the log and it is complete. "Unknown to
 * canonical" alone is not enough: on warm boot canonical is an older IDB save, so an entity
 * created since then has its creation rows in the gap/delta, not the log. Pre-existing and
 * such unknown-but-not-created-here entities are held until the final merge.
 *
 * Mutates s.
 */
export const routeLive = (event: StateEvent, s: RouteState): StateEvent[] => {
  if (s.merged) return [event];
  const entity = formatEntityID(event.entity);
  if (s.emittedEntities.has(entity)) return [event];
  if (s.isKnown(entity)) return [];

  const held = s.held.get(entity) ?? [];
  held.push(event);
  if (!held.some(isCreation) || !held.some((e) => linksTo(e, s.playerIds))) {
    s.held.set(entity, held);
    return [];
  }

  s.held.delete(entity);
  s.emittedEntities.add(entity);
  const ownedByAccount = (e: StateEvent) =>
    e.component === WALK_IDS.IDOwnsKami && linkValue(e) === s.accountId;
  if (held.some(ownedByAccount)) s.playerIds.add(entity);
  return held;
};
