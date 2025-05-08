import { World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getKamiByIndex, Kami } from 'network/shapes/Kami';
import { Trait } from 'network/shapes/Trait';

export const calcKamiScores = (world: World, components: Components, indices: number[]) => {
  return indices.map((index) => {
    const kami = getKamiByIndex(world, components, index, { traits: true });
    const score = calcKamiScore(kami);
    return { index, score };
  });
};

export const calcKamiScore = (kami: Kami) => {
  if (!kami.traits) return 0;

  const traits = kami.traits;
  const rarity = calcRarityScore(kami);
  const hPotential = calcHarvestPotential(traits.body, traits.hand);
  const gPotential = calcGuardianPotential(traits.body, traits.hand);

  const raw = rarity * Math.max(hPotential, gPotential);
  return Math.round(raw);
};

///////////////
// Trait Rarities

export const calcRarityScores = (world: World, components: Components, indices: number[]) => {
  return indices.map((index) => {
    const kami = getKamiByIndex(world, components, index, { traits: true });
    const rarity = calcRarityScore(kami);
    return { index, rarity };
  });
};

export const calcRarityScore = (kami: Kami) => {
  if (!kami.traits) return 0;

  const { body, hand, background, color, face } = kami.traits;
  const rarityScore = [body, hand, background, color, face].reduce((sum, trait) => {
    const traitPremium = 2 ** calcRarityPremium(trait);
    return sum + traitPremium;
  }, 0);

  return rarityScore;
};

export const calcRarityPremium = (trait: Trait) => {
  return 9 - trait.rarity;
};

///////////////
// Affinity

// evaluating the potential a kami has to be a good Harvester, based on affinities
// assumed body: +60/-25 and hand: +40/-15 for matchups
export const calcHarvestPotential = (body: Trait, hand: Trait) => {
  if (body.affinity === 'NORMAL') {
    if (hand.affinity === 'NORMAL') return 1;
    else return 1.4;
  }

  if (hand.affinity === 'NORMAL') return 1.6;
  if (body.affinity === hand.affinity) return 2;
  return 1.45;
};

// evaluate the potential a kami has to be a good Guardian, based on affinities
export const calcGuardianPotential = (body: Trait, hand: Trait) => {
  if (body.affinity === 'NORMAL') {
    if (hand.affinity === 'NORMAL') return 1.3;
    else return 1.7;
  }

  return 1;
};
