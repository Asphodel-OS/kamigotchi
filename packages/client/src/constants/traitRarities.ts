export const getTraitRarities = (tier: number) => {
  if (tier > traitRarities.length - 1) return traitRarities[0];
  return traitRarities[tier];
};

const traitRarities = [
  {
    // 0
    title: 'UNKNOWN',
    color: '#C9C7C7',
  },
  {
    // 1
    title: 'Legendary',
    color: '#FFB226',
  },
  {
    // 2
    title: 'Legendary',
    color: '#FFB226',
  },
  {
    // 3
    title: 'Legendary',
    color: '#FFB226',
  },
  {
    // 4
    title: 'Legendary',
    color: '#FFB226',
  },
  {
    // 5
    title: 'Exotic',
    color: '#E888EF',
  },
  {
    // 6
    title: 'Epic',
    color: '#BCA0ff',
  },
  {
    // 7
    title: 'Rare',
    color: '#9CBCD2',
  },
  {
    // 8
    title: 'Uncommon',
    color: '#A1C181',
  },
  {
    // 9
    title: 'Common',
    color: '#C9C7C7',
  },
];
