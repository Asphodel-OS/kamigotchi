import { BigNumberish } from 'ethers';

import { TxQueue } from 'engine/queue';
import { accountsAPI } from './accounts/accounts';
import { auctionsAPI } from './auctions';
import { bridgeAPI } from './bridge';
import { echoAPI } from './echo';
import { externalAPI } from './external';
import { gachaAPI } from './gacha';
import { goalsAPI } from './goals';
import { kamisAPI } from './kamis';
import { npcsAPI } from './npcs';

export type PlayerAPI = ReturnType<typeof createPlayerAPI>;

export function createPlayerAPI(txQueue: TxQueue) {
  const { call, systems } = txQueue;

  ////////////////
  // DROPTABLES

  function droptableReveal(ids: BigNumberish[]) {
    return systems['system.droptable.item.reveal'].executeTyped(ids);
  }

  /////////////////
  //   SCAVENGE

  // @dev claim scavenge points
  function claimScavenge(scavBarID: BigNumberish) {
    return systems['system.scavenge.claim'].executeTyped(scavBarID);
  }

  return {
    ...externalAPI(call),
    echo: echoAPI(systems),
    account: accountsAPI(systems),
    auction: auctionsAPI(systems),
    bridge: bridgeAPI(systems),
    gacha: gachaAPI(systems),
    npc: npcsAPI(systems),
    pet: kamisAPI(systems),

    // TODO: consider how to reorganize the below
    goal: goalsAPI(systems),
    droptable: {
      reveal: droptableReveal,
    },
    scavenge: {
      claim: claimScavenge,
    },
  };
}
