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
    let logged_rep = getReputationValue(world, components, account.id, 1);
    if(logged_rep == reputation_amount) {
      return 0;
    }
    return reputation_amount
  }
  const getAllAccountsReputationMismatch = (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);

    const account_reputation: [String, number][] = accounts.map(account => [account.id, getAccountMismatchReputation(account)])
    return account_reputation;
  }
  const doDaThing = (options?: AccountOptions) => {
    const accounts_earned_rep  = getAllAccountsReputationMismatch(options).filter(element => element[1] != 0);
   
    return accounts_earned_rep;
  }
  return {
    all: (options?: AccountOptions) =>  doDaThing(options),  
  }
  
  /*
  return {
    all: (options?: AccountOptions) => {
      console.log("test")
      const accounts = getAllAccounts(world, components, options); 
      for(let i = 0; i < accounts.length; i++) {
        let account_id = accounts[i].id;
        console.log("Account: ", account_id);
        /*
        let quests = getCompletedQuests(world, components, account_id);
        if(quests.length==0) {
          continue
        }
        for(let q = 0; q < quests.length; q++) { 
          account_exp_dict.set(account_id, 0);
          // find rep rewards
          for(let r = 0; r < quests[q].rewards.length; r++) { 
            if(quests[q].rewards[r].target.type == "REPUTATION") {
              let exp = Number(quests[q].rewards[r].target.value); 
            }
          }
          break
        } 
        break
        
      }
    }
  };
  */ 
};
