import {
  EntityID,
  EntityIndex,
  World,
  createEntity,
  getComponentValue,
  removeComponent,
  setComponent,
} from 'engine/recs';

import { Components } from 'network/components';
import { canRevealCommit } from 'network/shapes/Commit';
import { DTCommit } from 'network/shapes/Droptable';
import { Observable } from 'rxjs';
import { ActionState, ActionSystem } from '../ActionSystem';
import { NotificationSystem } from '../NotificationSystem';
import { notifyResult, sendKeepAliveNotif } from './functions';
import { CommitData, RevealType } from './types';

export type DTRevealerSystem = ReturnType<typeof createDTRevealerSystem>;

// reveal retry cap. after this many consecutive failed reveal txs a commit is
// marked FAILED and no longer auto-queued.
const MAX_REVEAL_FAILURES = 3;

// reveals committed item drops
export function createDTRevealerSystem(
  world: World,
  components: Components,
  blockNumber$: Observable<number>,
  actions: ActionSystem,
  notifications: NotificationSystem
) {
  let blockNumber = 0;
  blockNumber$.subscribe((num) => (blockNumber = num));

  const allCommits = new Map<EntityID, CommitData>();
  const queuedCommits = new Set<EntityID>();
  const revealingCommits = new Set<EntityID>();

  // for naming reveal types based on their parent entity. optional
  const entityNameMap = new Map<EntityID, string>();

  function add(commit: DTCommit, revealType: RevealType = 'droptable') {
    const existing = allCommits.get(commit.id);

    // first time we see this commit: register it
    if (!existing) {
      const data: CommitData = {
        ...commit,
        failures: 0,
        revealType,
      };
      allCommits.set(commit.id, data);
      if (canRevealCommit(commit)) queuedCommits.add(commit.id);
      return;
    }

    // already known and still on-chain (the commit query only returns live
    // commits). a large commit reveals in bounded chunks per tx, so re-queue it
    // whenever it is idle and still has rolls left, until it fully drains. skip
    // commits that are mid-reveal, already queued, or out of retries.
    const idle = !revealingCommits.has(commit.id) && !queuedCommits.has(commit.id);
    if (idle && canRevealCommit(commit) && existing.failures < MAX_REVEAL_FAILURES) {
      allCommits.set(commit.id, { ...existing, ...commit });
      queuedCommits.add(commit.id);
    }
  }

  function extractQueue(revealType?: RevealType): EntityID[] {
    const { State } = components;

    if (queuedCommits.size === 0) return [];

    const commits: EntityID[] = [];
    queuedCommits.forEach((id) => {
      const commitData = allCommits.get(id);
      // filter by reveal type
      if (revealType && commitData?.revealType !== revealType) return;

      queuedCommits.delete(id);
      commits.push(id);
      revealingCommits.add(id);

      let entity = world.entityToIndex.get(id) as EntityIndex;
      if (!entity) entity = createEntity(world, undefined, { id: id });
      setComponent(State, entity, { value: 'REVEALING' });
    });

    // keep alive notiffs
    if (commits.length > 0) sendKeepAliveNotif(notifications, true);

    return commits;
  }

  function forceQueue(commits: EntityID[]) {
    const { State } = components;

    for (let i = 0; i < commits.length; i++) {
      queuedCommits.delete(commits[i]);
      revealingCommits.add(commits[i]);

      let entity = world.entityToIndex.get(commits[i]) as EntityIndex;
      if (!entity) entity = createEntity(world, undefined, { id: commits[i] });
      setComponent(State, entity, { value: 'REVEALING' });
    }
  }

  function finishReveal(actionIndex: EntityIndex, commits: EntityID[]) {
    const { State } = components;

    for (let i = 0; i < commits.length; i++) revealingCommits.delete(commits[i]);
    if (getComponentValue(actions.Action, actionIndex)?.state === ActionState.Complete) {
      // reveal tx succeeded. a chunked commit may still have rolls left on-chain;
      // the per-block reconcile in add() re-queues it until it fully drains. reset
      // failures so a long drain is not killed by earlier transient failures.
      for (let i = 0; i < commits.length; i++) {
        const curr = allCommits.get(commits[i]);
        if (curr) allCommits.set(commits[i], { ...curr, failures: 0 });
        removeComponent(State, world.entityToIndex.get(commits[i])!);
        notifyResult(world, components, notifications, allCommits.get(commits[i]));
      }
    } else {
      // increment failure count, mark FAILED after the retry cap
      for (let i = 0; i < commits.length; i++) {
        const curr = allCommits.get(commits[i]);
        if (curr) {
          if (curr.failures < MAX_REVEAL_FAILURES) queuedCommits.add(commits[i]);
          else setComponent(State, world.entityToIndex.get(commits[i])!, { value: 'FAILED' });
          curr.failures++;
          allCommits.set(commits[i], curr);
        }
      }
    }

    if (revealingCommits.size === 0) sendKeepAliveNotif(notifications, false);
  }

  return {
    add,
    nameEntity: (id: EntityID, name: string) => entityNameMap.set(id, name),
    extractQueue,
    forceQueue,
    finishReveal,
  };
}
