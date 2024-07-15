import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { Account, AccountOptions, getAllAccounts } from 'network/shapes/Account';
import { getCompletedQuests } from 'network/shapes/Quest';
import { Goal, getAllGoals, getGoal, getGoalByIndex, getContributionByHash, Contribution, getReward, Reward} from 'network/shapes/Goal';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  const getAccountReputationFromQuests = (account: Account) => {
    // missing goal reputation rewards
    let expectedRep = 0;
    const completedQuestRewards = getCompletedQuests(world, components, account.id).map(
      (quest) => quest.rewards
    );
    completedQuestRewards.forEach((rewards) => {
      rewards.forEach((reward) => {
        if (reward.target.type == 'REPUTATION') {
          expectedRep += Number(reward.target.value);
        }
      });
    });

    //let currRep = account.reputation.agency;
    return expectedRep;// - currRep;
  };
  const getGoalReputationRewardMap = (goals: Goal[]) => {
    // returns dict of GoalId: [cutOff, amountReputationReward][]
    let GoalReputationMap = new Map<string,[number, number?][]>(); 
    for(let i = 0; i < goals.length; i++) {
      let rewards: Reward[] = goals[i].rewards;
      let sortedReputationRewards: [number, number?][] = sortReputationRewardsFromGoal(rewards);
      
      GoalReputationMap.set(goals[i].id, sortedReputationRewards);
    }
    return GoalReputationMap;
  };
  const sortReputationRewardsFromGoal = (rewards: Reward[]) => {
    //returns a desceding order list of [cutOff, amountReputationReward]
    let reputationRewards: Reward[] = rewards.filter((reward) => reward.Reward.target.type == "REPUTATION")
    let parsedRewards: [number, number?][] = reputationRewards.map((reward) => [Number(reward.cutoff), Number(reward.Reward.target.value)])
    let sortedRewards: [number, number?][] = parsedRewards.sort((a,b) => b[0]-a[0])
    
    return sortedRewards;
  }
  const getRewardForContribution = (amountContributed: number, reputationRewards:[number, number?][]) => {
    //returns the maxmium reward corresponding to an account amount contributed to the goal
    for(let i = 0; i < reputationRewards.length; i++) {
      if(amountContributed >= reputationRewards[i][0]) {
        return reputationRewards[i][1];
      }
    }
    return 0;
  }
  const getAccountReputationFromGoals = (account: Account, goalReputationMap: Map<string,[number, number?][]>, goals: Goal[]) => {
    let repFromGoals = 0
    for(let i = 0; i < goals.length; i++) {
      let amountContributed = Number(getContributionByHash(world, components, goals[i], account).score);
      if(amountContributed > 0) {
        let reputationRewards = goalReputationMap.get(goals[i].id);
        repFromGoals += getRewardForContribution(amountContributed, reputationRewards ?? []);
      }
    }
    return repFromGoals;
  }
  
  const getAllAccountsReputationMismatch = (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);
    console.log(`${accounts.length} accounts`);

    let goals: Goal[] = getAllGoals(world, components);
    //goalId: [rewardCuttof, rewardAmount]
    let goalReputationRewardMap : Map<string,[number, number?][]> = getGoalReputationRewardMap(goals); 

    const accountReputation: [String, number, number, number][] = accounts.map((account) => [
      account.id,
      getAccountReputationFromQuests(account),
      getAccountReputationFromGoals(account, goalReputationRewardMap, goals),
      account.reputation.agency
    ]);

    let accountsWithMismatch = accountReputation.filter((accountReputation) => accountReputation[1]+accountReputation[2]>accountReputation[3])
    console.log(accountsWithMismatch);
    let sus = accountReputation.filter((accountReputation) => accountReputation[1]+accountReputation[2]<accountReputation[3]);
    console.log(sus);
    return;
  };

  return {
    all: (options?: AccountOptions) => getAllAccountsReputationMismatch(options),
  };
};


