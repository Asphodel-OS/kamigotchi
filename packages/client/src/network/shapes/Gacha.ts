import { EntityID, World } from '@mud-classic/recs';
import { utils } from 'ethers';

import { GasExponent } from 'constants/gas';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Commit, getHolderCommits } from './Commit';
import { getConfigFieldValue } from './Config';
import { Kami } from './Kami';

export const GACHA_ID = formatEntityID(utils.solidityKeccak256(['string'], ['gacha.id']));

export const getGachaCommits = (
  world: World,
  components: Components,
  accountID: EntityID
): Commit[] => {
  return getHolderCommits(world, components, 'GACHA_COMMIT', accountID);
};

export const calcRerollCost = (world: World, components: Components, kami: Kami): bigint => {
  const baseCost = BigInt(getConfigFieldValue(world, components, 'GACHA_REROLL_PRICE'));
  const rerolls = BigInt((kami.rerolls || 0) + 1);
  const exponent = BigInt(10) ** BigInt(GasExponent);

  // placeholder linear function
  return (baseCost * rerolls) / exponent;
};
