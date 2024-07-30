import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { passesConditionsByFor } from '../Conditional';
import { Kami } from '../Kami';
import { Node } from './types';

export const passesNodeReqs = (
  world: World,
  components: Components,
  node: Node,
  account: Account,
  kami: Kami
): boolean => {
  return passesConditionsByFor(world, components, node.requirements, {
    account: account,
    kami: kami,
  });
};
