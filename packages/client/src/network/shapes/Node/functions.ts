import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { passesConditionsByFor } from '../Conditional';
import { Kami } from '../Kami';
import { getRequirements } from './getters';

// account edited out as it's not used atm
export const passesRequirements = (
  world: World,
  components: Components,
  index: number, // nodeIndex
  // account: Account,
  kami: Kami
): boolean => {
  if (!index) return false;
  const requirements = getRequirements(world, components, index);
  return passesConditionsByFor(world, components, requirements);
};
