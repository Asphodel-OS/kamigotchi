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
  const getAccountMismatchReputation = (account: Account) => {
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

    let currRep = account.reputation.agency;
    return expectedRep - currRep;
  };

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
  const getGoalReputationMap = (goals: Goal[]) => {
    // missing goal reputation rewards 
    let GoalReputationMap = new Map<string,[number, number?][]>(); 
    for(let i = 0; i < goals.length; i++) {
      let rewards: Reward[] = goals[i].rewards;
      let sortedReputationRewards: [number, number?][] = sortReputationRewardsFromGoal(rewards);
      
      GoalReputationMap.set(goals[i].id, sortedReputationRewards);
    }
    return GoalReputationMap;
  };
  const sortReputationRewardsFromGoal = (rewards: Reward[]) => {
    let reputationRewards: Reward[] = rewards.filter((reward) => reward.Reward.target.type == "REPUTATION")
    let parsedRewards: [number, number?][] = reputationRewards.map((reward) => [Number(reward.cutoff), Number(reward.Reward.target.value)])
    let sortedRewards: [number, number?][] = parsedRewards.sort((a,b) => b[0]-a[0])
    
    return sortedRewards;
  }

  const getAccountReputationFromGoals = (account: Account, goalReputationMap: Map<string,[number, number?][]>, goals: Goal[]) => {
    let repFromGoals = 0
    for(let i = 0; i < goals.length; i++) {
      let contribution: Contribution = getContributionByHash(world, components, goals[i], account);
      console.log(Number(contribution.score))
    }


    return repFromGoals;
  }

  const getAllAccountsReputationMismatch = (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);
    console.log(`${accounts.length} accounts`);

    let goals: Goal[] = getAllGoals(world, components);
    //goalId: [rewardCuttof, rewardAmount]
    let goalReputationMap : Map<string,[number, number?][]> = getGoalReputationMap(goals); 

    const accountReputation: [String, number, number][] = accounts.map((account) => [
      account.id,
      getAccountReputationFromQuests(account),
      //getAccountReputationFromGoals(account, goalReputationMap, goals),
      account.reputation.agency
    ]);
    //const accountWithMismath = accountReputation.filter((element) => element[1] != element[3]);
    //console.log(`${accountWithMismath.length} accounts with reputation mismatch`);
    return;
  };

  return {
    all: (options?: AccountOptions) => getAllAccountsReputationMismatch(options),
  };
};


