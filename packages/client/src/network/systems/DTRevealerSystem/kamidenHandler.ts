import { EntityID } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { subscribeToFeed, DroptableReveal } from 'clients/kamiden';
import { getItemDetailsByIndex } from 'network/shapes/Item';
import { NotificationSystem } from '../NotificationSystem';
import { NetworkLayer } from 'network/';
import { getAccountFromEmbedded } from 'network/shapes/Account';

export function setupKamidenRevealHandler(
  network: NetworkLayer,
  notifications: NotificationSystem
) {
  const { world, components } = network;

  return subscribeToFeed((feed) => {
    const account = getAccountFromEmbedded(network);
    if (account.id === ('0' as EntityID)) return;

    const accountID = formatEntityID(account.id);

    feed.DroptableReveals.forEach((reveal: DroptableReveal) => {
      const holderID = formatEntityID(reveal.HolderID);
      if (holderID !== accountID) return;

      if (reveal.ItemIndices.length !== reveal.ItemAmounts.length) {
        console.warn('DroptableReveal: misaligned arrays', reveal.CommitID);
        return;
      }

      const commitID = formatEntityID(reveal.CommitID);
      const notifId = `DroptableReveal-${commitID}` as EntityID;
      if (notifications.has(notifId)) return;

      const results: string[] = [];
      for (let i = 0; i < reveal.ItemIndices.length; i++) {
        const amount = Number(BigInt(reveal.ItemAmounts[i] || '0'));
        if (!Number.isSafeInteger(amount) || amount <= 0) continue;

        const item = getItemDetailsByIndex(world, components, reveal.ItemIndices[i]);
        if (item.index === 0) continue;

        results.push(`x${amount} ${item.name}`);
      }

      if (results.length === 0) return;

      notifications.add({
        id: notifId,
        title: 'Items revealed!',
        description: 'Received: ' + results.join(', '),
        time: (reveal.Timestamp * 1000).toString(),
        modal: 'inventory',
      });
    });
  });
}
