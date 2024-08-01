import { EntityID, World } from '@mud-classic/recs';
import { utils } from 'ethers';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getConfigFieldValueWei } from './Config';
import { Kami, KamiOptions, queryKamisX } from './Kami';
import { Commit } from './utils';
import { queryHolderCommits } from './utils/commits';

export const GACHA_ID = formatEntityID(utils.solidityKeccak256(['string'], ['gacha.id']));

export const queryGachaCommits = (
  world: World,
  components: Components,
  accountID: EntityID
): Commit[] => {
  return queryHolderCommits(world, components, 'GACHA_COMMIT', accountID);
};

export const queryGachaKamis = (
  world: World,
  components: Components,
  kamiOptions?: KamiOptions
): Kami[] => {
  return queryKamisX(world, components, { account: GACHA_ID }, kamiOptions);
};

export const calcRerollCost = (world: World, components: Components, kami: Kami): bigint => {
  const baseCost = getConfigFieldValueWei(world, components, 'GACHA_REROLL_PRICE');

  // placeholder linear function
  return baseCost * BigInt((kami.rerolls || 0) + 1);
};
