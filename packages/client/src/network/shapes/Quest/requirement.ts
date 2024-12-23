import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { Condition, Status, checkBoolean, checkCurrent, checkerSwitch } from '../Conditional';
import { getConditionsOf } from '../Conditional/queries';

export interface Requirement extends Condition {}

// Get the Entity Indices of the Requirements of a Quest
export const getRequirements = (
  world: World,
  components: Components,
  questIndex: number
): Requirement[] => {
  return getConditionsOf(world, components, 'registry.quest.requirement', questIndex);
};

export const checkRequirement = (
  world: World,
  components: Components,
  requirement: Requirement,
  account: Account
): Status => {
  return checkerSwitch(
    requirement.logic,
    checkCurrent(world, components, requirement.target, account),
    undefined,
    undefined,
    checkBoolean(world, components, requirement.target, account),
    { completable: false }
  );
};
