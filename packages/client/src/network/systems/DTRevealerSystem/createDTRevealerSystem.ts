import {
  EntityID,
  EntityIndex,
  World,
  createEntity,
  getComponentValue,
  removeComponent,
  setComponent,
} from '@mud-classic/recs';
import { Components } from 'network/components';
import { DTCommit } from 'network/shapes/Droptable';
import { canReveal } from 'network/shapes/utils/commits';
import { Observable } from 'rxjs';
import { ActionState, ActionSystem } from '../ActionSystem';
import { NotificationSystem } from '../NotificationSystem';
import { notifyResult, sendKeepAliveNotif } from './functions';
import { CommitData } from './types';

export type DTRevealerSystem = ReturnType<typeof createDTRevealerSystem>;

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

  function add(commit: DTCommit) {
    // filters out commits that are already in the system
    if (allCommits.has(commit.id)) return;

    // Add commit to system
    const data: CommitData = {
      ...commit,
      failures: 0,
    };
    allCommits.set(commit.id, data);
    if (canReveal(commit, blockNumber)) queuedCommits.add(commit.id);
  }

  function extractQueue(): EntityID[] {
    const { State } = components;

    if (queuedCommits.size === 0) return [];

    // notification: keep alive
    sendKeepAliveNotif(notifications, true);

    const commits: EntityID[] = [];
    queuedCommits.forEach((id) => {
      queuedCommits.delete(id);
      commits.push(id);
      revealingCommits.add(id);

      let entity = world.entityToIndex.get(id) as EntityIndex;
      if (!entity) entity = createEntity(world, undefined, { id: id });
      setComponent(State, entity, { value: 'REVEALING' });
    });

    return commits;
  }

  function forceQueue(commits: EntityID[]) {
    const { State } = components;

    for (let i = 0; i < commits.length; i++) {
      queuedCommits.delete(commits[i]);
      revealingCommits.add(commits[0]);

      let entity = world.entityToIndex.get(commits[i]) as EntityIndex;
      if (!entity) entity = createEntity(world, undefined, { id: commits[i] });
      setComponent(State, entity, { value: 'REVEALING' });
    }
  }

  function finishReveal(actionIndex: EntityIndex, commits: EntityID[]) {
    const { State } = components;

    for (let i = 0; i < commits.length; i++) revealingCommits.delete(commits[i]);
    if (getComponentValue(actions.Action, actionIndex)?.state === ActionState.Complete) {
      // upon reveal success
      for (let i = 0; i < commits.length; i++) {
        removeComponent(State, world.entityToIndex.get(commits[i])!);
        notifyResult(world, components, notifications, allCommits.get(commits[i]));
      }
    } else {
      console.log('revealer: reveal failed');
      // increment failure count, remove from queue after 3 tries
      for (let i = 0; i < commits.length; i++) {
        const curr = allCommits.get(commits[i]);
        if (curr) {
          if (curr.failures < 3) queuedCommits.add(commits[i]);
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
