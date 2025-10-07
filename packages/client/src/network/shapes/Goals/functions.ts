import { World } from 'engine/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { passesConditions } from '../Conditional';
import { Contribution, Goal } from './types';

export const canContribute = (
  world: World,
  components: Components,
  goal: Goal,
  account: Account
): [boolean, string] => {
  if (goal.complete) return [false, 'Goal already completed'];

  if (!passesConditions(world, components, goal.requirements, account))
    return [false, 'Requirements not met'];

  return [true, ''];
};

export const canClaim = (goal: Goal, contribution: Contribution | undefined): [boolean, string] => {
  if (!goal.complete) return [false, 'Goal still in progress (be patient!)'];

  if (!contribution || contribution.score == 0)
    return [false, 'You did not contribute - stop slacking and lock in, loser.'];
  else if (contribution.claimed) return [false, 'Already claimed!'];

  return [true, ''];
};
