import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { Account, AccountOptions, getAllAccounts } from 'network/shapes/Account';
import { getCompletedQuests } from 'network/shapes/Quest';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  const getAccountMismatchReputation = (account: Account) => {
    // missing goal reputation rewards
    let expectedRep = 0;
    const completed_quests_rewards = getCompletedQuests(world, components, account.id).map(
      (quest) => quest.rewards
    );
    completed_quests_rewards.forEach((rewards) => {
      rewards.forEach((reward) => {
        if (reward.target.type == 'REPUTATION') {
          expectedRep += Number(reward.target.value);
        }
      });
    });

    let currRep = account.reputation.agency;
    return expectedRep - currRep;
  };

  const getAllAccountsReputationMismatch = (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);
    console.log(`${accounts.length} accounts`);
    const account_reputation: [String, number][] = accounts.map((account) => [
      account.id,
      getAccountMismatchReputation(account),
    ]);
    const accounts_with_mismatch = account_reputation.filter((element) => element[1] != 0);
    console.log(`${accounts_with_mismatch.length} accounts with reputation mismatch`);
    return accounts_with_mismatch;
  };

  return {
    all: (options?: AccountOptions) => getAllAccountsReputationMismatch(options),
  };
};
