import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { getConfigFieldValue } from './Config';
import { Kami, queryKamisX } from './Kami';
import { NetworkLayer } from 'layers/network/types';

// standardized shape of a gacha commit
export interface GachaCommit {
  id: EntityID;
  revealBlock: number;
  // account (not needed in FE)
  // increment (not needed in FE)
  // reroll (shown in Kami)
}

export const getCommit = (network: NetworkLayer, index: EntityIndex): GachaCommit => {
  const {
    components: {
      RevealBlock,
    },
    world,
  } = network;

  return {
    id: world.entities[index],
    revealBlock: (getComponentValue(RevealBlock, index)?.value as number) * 1,
  };
}

export const queryAccCommits = (network: NetworkLayer, accountID: EntityID): GachaCommit[] => {
  const {
    components: {
      AccountID,
      Type,
      RevealBlock
    },
  } = network;

  const toQuery: QueryFragment[] = [
    HasValue(AccountID, { value: accountID }),
    HasValue(Type, { value: 'GACHA_COMMIT' }),
    Has(RevealBlock),
  ];

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): GachaCommit => getCommit(network, index)
  );
}

export const queryGachaKamis = (network: NetworkLayer): Kami[] => {
  return queryKamisX(network, { state: "GACHA" });
}

export const calcRerollCost = (network: NetworkLayer, kami: Kami): number => {
  const baseCost = getConfigFieldValue(network, 'GACHA_REROLL_PRICE');

  // placeholder linear function
  return baseCost * (kami.rerolls + 1);
}

export const isGachaAvailable = (commit: GachaCommit, currBlock: number): boolean => {
  // although commits are valid for 256 blocks, set to 250 for a small buffer
  return commit.revealBlock + 250 > currBlock;
}