import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { passesConditionsByFor } from '../Conditional';
import { Kami } from '../Kami';
import { getRequirements } from './getters';

export const passesRequirements = (
  world: World,
  components: Components,
  index: number, // nodeIndex
  account: Account,
  kami: Kami
): boolean => {
  const requirements = getRequirements(world, components, index);
  return passesConditionsByFor(world, components, requirements, {
    account: account,
    kami: kami,
  });
};
