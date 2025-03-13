import { EntityID, World } from '@mud-classic/recs';
import { utils } from 'ethers';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Commit, getHolderCommits } from './Commit';

export const GACHA_ID = formatEntityID(utils.solidityKeccak256(['string'], ['gacha.id']));

export const getGachaCommits = (
  world: World,
  components: Components,
  accountID: EntityID
): Commit[] => {
  return getHolderCommits(world, components, 'GACHA_COMMIT', accountID);
};
