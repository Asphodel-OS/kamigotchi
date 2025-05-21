import { Trait } from 'network/shapes/Trait';

// compare two traits for sorting
export const compare = (a: Trait, b: Trait) => {
  // first compare by body affinity
  if (a.affinity! < b.affinity!) return -1;
  if (a.affinity! > b.affinity!) return 1;

  // then compare their rarity
  if (a.rarity < b.rarity) return -1;
  if (a.rarity > b.rarity) return 1;

  // then compare their name
  if (a.name! < b.name) return -1;
  if (a.name! > b.name!) return 1;

  return 0;
};
