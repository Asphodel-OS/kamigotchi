import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { getConfigFieldValue } from './Config';
import { Kami, queryKamisX } from './Kami';

// standardized shape of a gacha commit
export interface GachaCommit {
  id: EntityID;
  revealBlock: number;
  // account (not needed in FE)
  // increment (not needed in FE)
  // reroll (shown in Kami)
}

export const getCommit = (layers: Layers, index: EntityIndex): GachaCommit => {
  const {
    network: {
      components: {
        RevealBlock,
      },
      world,
    },
  } = layers;

  return {
    id: world.entities[index],
    revealBlock: (getComponentValue(RevealBlock, index)?.value as number) * 1,
  };
}

export const queryAccCommits = (layers: Layers, accountID: EntityID): GachaCommit[] => {
  const {
    network: {
      components: {
        AccountID,
        Type,
        RevealBlock
      },
    },
  } = layers;

  const toQuery: QueryFragment[] = [
    HasValue(AccountID, { value: accountID }),
    HasValue(Type, { value: 'GACHA_COMMIT' }),
    Has(RevealBlock),
  ];

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): GachaCommit => getCommit(layers, index)
  );
}

export const queryGachaKamis = (layers: Layers): Kami[] => {
  return queryKamisX(layers, { state: "GACHA" });
}

export const calcRerollCost = (layers: Layers, kami: Kami): number => {
  const baseCost = getConfigFieldValue(layers.network, 'GACHA_REROLL_PRICE');

  // placeholder linear function
  return baseCost * (kami.rerolls + 1);
}

export const isGachaAvailable = (commit: GachaCommit, currBlock: number): boolean => {
  // although commits are valid for 256 blocks, set to 250 for a small buffer
  return commit.revealBlock + 250 > currBlock;
}