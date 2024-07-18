import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { AdminAPI, PlayerAPI } from 'network/api';
import { Account, AccountOptions, getAllAccounts } from 'network/shapes/Account';
import { Goal, Reward, getAllGoals, getContributionByHash } from 'network/shapes/Goal';
import { getCompletedQuests } from 'network/shapes/Quest';

// explorer for our 'shapes', exposed on the window object @ network.explorer
export const initPlayground = (
  world: World,
  components: Components,
  api: { admin: AdminAPI; player: PlayerAPI }
) => {
  // const splitCaller = async (data: { id: string; amt: number }[]) => {
  //   const

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
    return expectedRep; // - currRep;
  };
  const getGoalReputationRewardMap = (goals: Goal[]) => {
    // returns dict of GoalId: [cutOff, amountReputationReward][]
    let GoalReputationMap = new Map<string, [number, number?][]>();
    for (let i = 0; i < goals.length; i++) {
      let rewards: Reward[] = goals[i].rewards;
      let sortedReputationRewards: [number, number?][] = sortReputationRewardsFromGoal(rewards);

      GoalReputationMap.set(goals[i].id, sortedReputationRewards);
    }
    return GoalReputationMap;
  };

  const sortReputationRewardsFromGoal = (rewards: Reward[]) => {
    //returns a desceding order list of [cutOff, amountReputationReward]
    let reputationRewards: Reward[] = rewards.filter(
      (reward) => reward.Reward.target.type == 'REPUTATION'
    );
    let parsedRewards: [number, number?][] = reputationRewards.map((reward) => [
      Number(reward.cutoff),
      Number(reward.Reward.target.value),
    ]);
    let sortedRewards: [number, number?][] = parsedRewards.sort((a, b) => b[0] - a[0]); //descending order

    return sortedRewards;
  };

  const getRewardForContribution = (
    amountContributed: number,
    reputationRewards: [number, number?][]
  ) => {
    let total = 0;
    for (let i = 0; i < reputationRewards.length; i++) {
      if (amountContributed >= reputationRewards[i][0]) {
        total += reputationRewards[i][1] ?? 0;
      }
    }
    return total;
  };

  const getAccountReputationFromGoals = (
    account: Account,
    goalReputationMap: Map<string, [number, number?][]>,
    goals: Goal[]
  ) => {
    let repFromGoals = 0;
    for (let i = 0; i < goals.length; i++) {
      const contribution = getContributionByHash(world, components, goals[i], account);
      if (contribution.score > 0 && contribution.claimed) {
        const reputationRewards = goalReputationMap.get(goals[i].id);
        repFromGoals += getRewardForContribution(contribution.score, reputationRewards ?? []);
      }
    }
    return repFromGoals;
  };

  const getAllAccountsReputationMismatch = async (options?: AccountOptions) => {
    const accounts = getAllAccounts(world, components, options);
    console.log(`${accounts.length} accounts`);

    let goals: Goal[] = getAllGoals(world, components);
    //goalId: [rewardCuttof, rewardAmount]
    let goalReputationRewardMap: Map<string, [number, number?][]> =
      getGoalReputationRewardMap(goals);

    const accountReputation: [String, number, number, number][] = accounts.map((account) => [
      account.id,
      getAccountReputationFromQuests(account),
      getAccountReputationFromGoals(account, goalReputationRewardMap, goals),
      account.reputation.agency,
    ]);

    // const accountReputation: { id: string; diff: number }[] = accounts.map((account) => ({
    //   id: account.id,
    //   diff:
    //     getAccountReputationFromQuests(account) +
    //     getAccountReputationFromGoals(account, goalReputationRewardMap, goals) -
    //     account.reputation.agency,
    // }));

    // const accountsWithMismatch = accountReputation.filter(
    //   (accountReputation) => accountReputation[1] + accountReputation[2] > accountReputation[3]
    // );
    // const accountsWithMismatch = accountReputation.filter(
    //   (accountReputation) => accountReputation.diff > 0
    // );
    // console.log('mismatched accounts', accountsWithMismatch);

    // "0x11308e838e86e32b1c708a32c17ea479cbee46ed5af59e6141ad75e7c54defc8"
    // 15

    // const ids = [];
    // const amts = [];
    // for (let i = 0; i < accountsWithMismatch.length; i++) {
    //   // for (let i = 0; i < 1; i++) {
    //   ids.push(accountsWithMismatch[i].id);
    //   amts.push(accountsWithMismatch[i].diff);
    // }

    // console.log('ids', ids);
    // console.log('amts', amts);
    // await api.admin.repFix(ids, amts);

    let sus = accountReputation.filter(
      (accountReputation) => accountReputation[1] + accountReputation[2] < accountReputation[3]
    );
    console.log(sus);
    return;
  };

  return {
    all: (options?: AccountOptions) => getAllAccountsReputationMismatch(options),
  };
};
