import { DroptableReveal, SacrificeReveal, subscribeToFeed } from 'clients/kamiden';
import { EntityID, World } from 'engine/recs';
import { formatEntityID } from 'engine/utils';
import { NetworkComponents, NetworkLayer } from 'network/';
import { getAccountFromEmbedded } from 'network/shapes/Account';
import { getItemDetailsByIndex } from 'network/shapes/Item';
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

function parseRevealResults(
  world: World,
  components: NetworkComponents,
  reveal: RevealBase,
  logPrefix: string
): string[] {
  const commitID = formatEntityID(reveal.CommitID);
  const results: string[] = [];

  for (let i = 0; i < reveal.ItemIndices.length; i++) {
    const rawAmount = reveal.ItemAmounts[i];

    if (typeof rawAmount !== 'string' || !/^-?\d+$/.test(rawAmount)) {
      log.warn(`${logPrefix}: invalid ItemAmount at index ${i}`, { commitID, rawAmount });
      continue;
    }

    let parsedAmountBigInt: bigint;
    try {
      parsedAmountBigInt = BigInt(rawAmount);
    } catch (e) {
      log.warn(`${logPrefix}: failed to parse ItemAmount at index ${i}`, {
        commitID,
        rawAmount,
        error: e,
      });
      continue;
    }

    if (parsedAmountBigInt <= 0n) continue;

    if (parsedAmountBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
      log.warn(`${logPrefix}: ItemAmount exceeds safe integer range at index ${i}`, {
        commitID,
        rawAmount,
      });
      continue;
    }

    const amount = Number(parsedAmountBigInt);
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;

    const item = getItemDetailsByIndex(world, components, reveal.ItemIndices[i]);
    if (item.index === 0) continue;

    results.push(`x${amount} ${item.name}`);
  }

  return results;
}

function processReveal(
  world: World,
  components: NetworkComponents,
  notifications: NotificationSystem,
  reveal: RevealBase,
  accountID: string,
  config: { logPrefix: string; notifPrefix: string; title: string }
): void {
  const holderID = formatEntityID(reveal.HolderID);
  if (holderID !== accountID) return;

  if (reveal.ItemIndices.length !== reveal.ItemAmounts.length) {
    console.warn(`${config.logPrefix}: misaligned arrays`, reveal.CommitID);
    return;
  }

  const commitID = formatEntityID(reveal.CommitID);
  const notifId = `${config.notifPrefix}-${commitID}` as EntityID;
  if (notifications.has(notifId)) return;

  const results = parseRevealResults(world, components, reveal, config.logPrefix);
  if (results.length === 0) return;

  notifications.add({
    id: notifId,
    title: config.title,
    description: 'Received: ' + results.join(', '),
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
      log.warn(JSON.stringify(reveal));
      const kamiIndex = world.entityToIndex.get(formatEntityID(reveal.KamiID));
      const kami = getKami(world, components, kamiIndex!);
      const kamiName = kami?.name ?? 'Kami';
      log.error(JSON.stringify(kami));
      processReveal(world, components, notifications, reveal, accountID, {
        logPrefix: 'SacrificeReveal',
        notifPrefix: 'sacrificeReveal',
        title: `${kamiName} sacrificed!`,
      });
    });
  });
}
