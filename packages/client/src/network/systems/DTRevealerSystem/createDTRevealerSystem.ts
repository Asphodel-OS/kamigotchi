import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';
import { PlayerAPI } from 'network/api';
import { Components } from 'network/components';
import { DTCommit, getDTLogByHash } from 'network/shapes/Droptable';
import { canReveal } from 'network/shapes/utils/commits';
import { waitForActionCompletion, waitForComponentValueUpdate } from 'network/utils';
import { Observable } from 'rxjs';
import { ActionState, ActionSystem } from '../ActionSystem';
import { NotificationSystem } from '../NotificationSystem';
import { sendKeepAliveNotif, sendResultNotif } from './functions';
import { CommitData } from './types';

export type DTRevealerSystem = ReturnType<typeof createDTRevealerSystem>;

// reveals committed item drops
export function createDTRevealerSystem(
  world: World,
  components: Components,
  blockNumber$: Observable<number>,
  Actions: ActionSystem,
  Notifications: NotificationSystem,
  api: PlayerAPI
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

  async function execute() {
    if (queuedCommits.size === 0) return;

    // notification: keep alive
    sendKeepAliveNotif(Notifications, true);

    const commits: EntityID[] = [];
    queuedCommits.forEach((id) => {
      queuedCommits.delete(id);
      commits.push(id);
      revealingCommits.add(id);
    });

    // hardcode wait
    await new Promise((resolve) => setTimeout(resolve, 500));

    const actionIndex = Actions.add({
      action: 'Droptable reveal',
      params: [commits],
      description: `Inspecting item contents`,
      execute: async () => {
        return api.droptable.reveal(commits);
      },
    });
    await waitForActionCompletion(Actions.Action, actionIndex);

    if (getComponentValue(Actions.Action, actionIndex)?.state === ActionState.Complete) {
      // upon reveal success
      for (let i = 0; i < commits.length; i++) {
        notifyResult(commits[i]);
        revealingCommits.delete(commits[i]);
      }
    } else {
      console.log('revealer: reveal failed');

      // increment failure count, remove from queue after 3 tries
      for (let i = 0; i < commits.length; i++) {
        const curr = allCommits.get(commits[i]);
        if (curr) {
          if (curr.failures < 3) queuedCommits.add(commits[i]);
          curr.failures++;
          allCommits.set(commits[i], curr);
        }
      }
    }

    // notification:
    // remove keep alive (if none in progress - global revealingCommits accounts for consecutive reveals)
    if (revealingCommits.size == 0) sendKeepAliveNotif(Notifications, false);
  }

  async function notifyResult(id: EntityID) {
    const commit = allCommits.get(id);
    if (!commit) return;

    await waitForRevealed(commit.entityIndex);

    const resultLog = getDTLogByHash(world, components, commit.holder, commit.parentID);

    sendResultNotif(
      Notifications,
      commit.parentID,
      commit.rolls,
      resultLog,
      entityNameMap.get(commit.parentID)
    );
  }

  // waits for component values to be updated via revealblock getting removed
  async function waitForRevealed(entity: EntityIndex) {
    const { RevealBlock } = components;
    if (!hasComponent(RevealBlock, entity)) return;
    await waitForComponentValueUpdate(RevealBlock, entity);
  }

  return {
    add,
    execute,
    nameEntity: (id: EntityID, name: string) => entityNameMap.set(id, name),
  };
}
