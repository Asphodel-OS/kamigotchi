import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { AccountOptions, getAllAccounts } from 'network/shapes/Account';
import { getCompletedQuests } from 'network/shapes/Quest';
import { getReputationValue } from 'network/shapes/Faction';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  const getAccountMismatchReputation = (account: Account) => {
    let reputation_amount = 0;
    const completed_quests_rewards = getCompletedQuests(world, components, account.id)
                                        .map(quest => quest.rewards);
    completed_quests_rewards.forEach((rewards) => {
      rewards.forEach((reward) => {
        if(reward.target.type == "REPUTATION") {
          reputation_amount += Number(reward.target.value)
        }
      })
    })
    let faction_rep = getReputationValue(world, components, account.id, 1);
    if(faction_rep == reputation_amount) {
      return 0;
    }
    return reputation_amount
  }
  const getAllAccountsReputationMismatch = (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);
    console.log(`${accounts.length} accounts`)
    const account_reputation: [String, number][] = accounts.map(account => [account.id, getAccountMismatchReputation(account)])
    const accounts_with_mismatch = account_reputation.filter(element => element[1] != 0);
    console.log(`${accounts_with_mismatch.length} accounts with reputation mismatch`)
    return accounts_with_mismatch;
  }
  return {
    all: (options?: AccountOptions) =>  getAllAccountsReputationMismatch(options),  
  }
  
};
