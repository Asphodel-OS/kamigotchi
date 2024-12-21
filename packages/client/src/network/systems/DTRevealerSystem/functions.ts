import { EntityID, EntityIndex, World, hasComponent } from '@mud-classic/recs';
import { Components } from 'network/components';
import { DTLog, getDTLogByHash } from 'network/shapes/Droptable';
import { NotificationSystem } from 'network/systems';
import { waitForComponentValueUpdate } from 'network/utils';
import { CommitData } from './types';

/////////////////
// UTILS

// waits for component values to be updated via revealblock getting removed
export async function waitForRevealed(components: Components, entity: EntityIndex) {
  const { RevealBlock } = components;
  if (!hasComponent(RevealBlock, entity)) return;
  await waitForComponentValueUpdate(RevealBlock, entity);
}

/////////////////
// NOTIFICATIONS

export async function notifyResult(
  world: World,
  components: Components,
  notifications: NotificationSystem,
  commit: CommitData | undefined
) {
  if (!commit) return;

  await waitForRevealed(components, commit.entity);
  const resultLog = getDTLogByHash(world, components, commit.holder, commit.parentID);
  sendResultNotif(notifications, commit.parentID, commit.rolls, resultLog);
}

export const sendKeepAliveNotif = (notifications: NotificationSystem, status: boolean) => {
  const id = 'RevealerKeepAlive';
  if (status)
    notifications.add({
      id: id as EntityID,
      title: 'Revealing items',
      description: `Don't close this page!`,
      time: Date.now().toString(),
      // modal: 'reveal',
    });
  else notifications.remove(id as EntityID);
};

export const sendResultNotif = async (
  notifications: NotificationSystem,
  type: string,
  count: number,
  result: DTLog,
  name?: string
) => {
  const resultText = result.results.map((entry) => `x${entry.amount} ${entry.object.name}`);
  const description = 'Received: ' + resultText.join(', ');

  const id = 'RevealerResult' + type; // one notif per reveal type
  notifications.add({
    id: id as EntityID,
    title: `x${count} ${name ?? 'Items'} revealed!`,
    description: description,
    time: Date.now().toString(),
    modal: 'inventory',
  });
};
