export const getRarities = (tier: number) => {
  const result = rarities[tier - 1];
  return result ?? unknownRarity;
};

const rarities = [
  {
    // 1
    title: 'Legendary',
    color: '#F6DDCC',
  },
  {
    // 2
    title: 'Legendary',
    color: '#F6DDCC',
  },
  {
    // 3
    title: 'Legendary',
    color: '#F6DDCC',
  },
  {
    // 4
    title: 'Legendary',
    color: '#F6DDCC',
  },
  {
    // 5
    title: 'Epic',
    color: '#E8DAEF',
  },
  {
    // 6
    title: 'Exotic',
    color: '#D6EAF8',
  },
  {
    // 7
    title: 'Rare',
    color: '#D4EFDF',
  },
  {
    // 8
    title: 'Uncommon',
    color: '#F2F3F4',
  },
  {
    // 9
    title: 'Common',
    color: '#F2F3F4',
  },
];

const unknownRarity = {
  title: 'Unknown',
  color: '#F2F3F4',
};
