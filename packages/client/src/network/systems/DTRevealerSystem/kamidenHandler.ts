import { DroptableReveal, SacrificeReveal, subscribeToFeed } from 'clients/kamiden';
import { EntityID, World } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { Components, NetworkLayer } from 'network/';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { getItemByIndex } from 'network/shapes/Item';
import { getKami } from 'network/shapes/Kami';
import { log } from 'utils/logger';
import { NotificationSystem } from '../NotificationSystem';

type RevealBase = {
  HolderID: string;
  CommitID: string;
  ItemIndices: number[];
  ItemAmounts: string[];
  Timestamp: number;
};

type ParsedRevealItem = {
  index: number;
  amount: string;
  name: string;
};

function parseRevealResults(
  world: World,
  components: Components,
  reveal: RevealBase
): ParsedRevealItem[] {
  const results: ParsedRevealItem[] = [];

  for (let i = 0; i < reveal.ItemIndices.length; i++) {
    const amount = reveal.ItemAmounts[i];
    const rawIndex = reveal.ItemIndices[i];

    if (!amount || amount === '0') continue;

    const item = getItemByIndex(world, components, rawIndex);
    if (item.index === 0) continue;

    results.push({
      index: item.index,
      amount,
      name: item.name,
    });
  }

  return results;
}

function processReveal(
  world: World,
  components: Components,
  notifications: NotificationSystem,
  reveal: RevealBase,
  accountID: string,
  config: { logPrefix: string; notifPrefix: string; title: string }
): void {
  const holderID = formatEntityID(reveal.HolderID);
  if (holderID !== accountID) return;

  if (reveal.ItemIndices.length !== reveal.ItemAmounts.length) {
    log.warn(`${config.logPrefix}: misaligned arrays`, { commitID: reveal.CommitID });
    return;
  }

  const commitID = formatEntityID(reveal.CommitID);
  const notifId = `${config.notifPrefix}-${commitID}` as EntityID;
  if (notifications.has(notifId)) return;

  const results = parseRevealResults(world, components, reveal);
  if (results.length === 0) return;

  const descriptionText = 'Received: ' + results.map((r) => `x${r.amount} ${r.name}`).join(', ');

  notifications.add({
    id: notifId,
    title: config.title,
    description: descriptionText,
    itemIndices: results.map((r) => r.index),
    itemAmounts: results.map((r) => r.amount),
    time: (reveal.Timestamp * 1000).toString(),
    modal: 'inventory',
  });
}

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
      log.debug('Got reveal');
      processReveal(world, components, notifications, reveal, accountID, {
        logPrefix: 'DroptableReveal',
        notifPrefix: 'DroptableReveal',
        title: 'Items revealed!',
      });
    });

    feed.SacrificeReveals.forEach((reveal: SacrificeReveal) => {
      log.debug('Got sacrifice reveal');
      const kamiIndex = world.entityToIndex.get(formatEntityID(reveal.KamiID));
      const kami = getKami(world, components, kamiIndex!);
      const kamiName = kami?.name ?? 'Kami';
      processReveal(world, components, notifications, reveal, accountID, {
        logPrefix: 'SacrificeReveal',
        notifPrefix: 'sacrificeReveal',
        title: `${kamiName} sacrificed!`,
      });
    });
  });
}
