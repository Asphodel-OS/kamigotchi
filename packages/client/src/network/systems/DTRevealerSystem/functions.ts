import { EntityID, EntityIndex, World, hasComponent } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
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

  const commitID = formatEntityID(commit.id);
  const notifId = `DroptableReveal-${commitID}` as EntityID;

  if (notifications.has(notifId)) return;

  await waitForRevealed(components, commit.entity);
  const resultLog = getDTLogByHash(world, components, commit.holder, commit.anchorID);
  sendResultNotifWithId(notifications, notifId, commit.rolls, resultLog);
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

export const sendResultNotifWithId = (
  notifications: NotificationSystem,
  id: EntityID,
  count: number,
  result: DTLog,
  name?: string
) => {
  const resultText = result.results.map((entry) => `x${entry.amount} ${entry.object.name}`);
  const description = 'Received: ' + resultText.join(', ');

  notifications.add({
    id,
    title: `x${count} ${name ?? 'Items'} revealed!`,
    description,
    time: Date.now().toString(),
    modal: 'inventory',
  });
};

export const sendResultNotif = async (
  notifications: NotificationSystem,
  type: string,
  count: number,
  result: DTLog,
  name?: string
) => {
  const id = `DroptableReveal-${formatEntityID(type)}` as EntityID;
  sendResultNotifWithId(notifications, id, count, result, name);
};
