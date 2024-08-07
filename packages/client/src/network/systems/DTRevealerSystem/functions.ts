import { EntityID } from '@mud-classic/recs';
import { DTLog } from 'network/shapes/Droptable';
import { NotificationSystem } from '../NotificationSystem';

export const sendKeepAliveNotif = (Notifications: NotificationSystem, status: boolean) => {
  const id = 'RevealerKeepAlive';
  if (status)
    Notifications.add({
      id: id as EntityID,
      title: 'Revealing items',
      description: `Don't close this page!`,
      time: Date.now().toString(),
    });
  else Notifications.remove(id as EntityID);
};

export const sendResultNotif = async (
  Notifications: NotificationSystem,
  type: string,
  count: number,
  result: DTLog,
  name?: string
) => {
  const resultText = result.results.map((entry) => `x${entry.amount} ${entry.object.name}`);
  const description = 'Received: ' + resultText.join(', ');

  const id = 'RevealerResult' + type; // one notif per reveal type
  Notifications.add({
    id: id as EntityID,
    title: `x${count} ${name ?? 'Items'} revealed!`,
    description: description,
    time: Date.now().toString(),
    modal: 'inventory',
  });

  // TODO: actual notif removal
  await new Promise((resolve) => setTimeout(resolve, 30000));
  Notifications.remove(id as EntityID);
};
