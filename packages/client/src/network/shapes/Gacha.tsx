import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { utils } from 'ethers';

import { Components } from 'network/';
import { getConfigFieldValueWei } from './Config';
import { Kami, KamiOptions, queryKamisX } from './Kami';
import { Commit } from './utils/Revealables';

export const GACHA_ID = utils.solidityKeccak256(['string'], ['gacha.id']);

export const getCommit = (world: World, components: Components, index: EntityIndex): Commit => {
  const { RevealBlock } = components;

  return {
    id: world.entities[index],
    revealBlock: (getComponentValue(RevealBlock, index)?.value as number) * 1,
  };
};

export const queryAccCommits = (
  world: World,
  components: Components,
  accountID: EntityID
): Commit[] => {
  const { AccountID, Type, RevealBlock } = components;

  const toQuery: QueryFragment[] = [
    HasValue(AccountID, { value: accountID }),
    HasValue(Type, { value: 'GACHA_COMMIT' }),
    Has(RevealBlock),
  ];

  const raw = Array.from(runQuery(toQuery));

  return raw.map((index): Commit => getCommit(world, components, index));
};

export const queryGachaKamis = (
  world: World,
  components: Components,
  kamiOptions?: KamiOptions
): Kami[] => {
  return queryKamisX(world, components, { account: GACHA_ID as EntityID }, kamiOptions);
};

export const calcRerollCost = (world: World, components: Components, kami: Kami): bigint => {
  const baseCost = getConfigFieldValueWei(world, components, 'GACHA_REROLL_PRICE');

  // placeholder linear function
  return baseCost * BigInt(kami.rerolls + 1);
};
