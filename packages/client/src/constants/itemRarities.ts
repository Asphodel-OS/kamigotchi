export const getItemRarities = (tier: number) => {
  if (tier > itemRarities.length - 1) return itemRarities[0];
  return itemRarities[tier];
};

const itemRarities = [
  {
    // 0 DEFAULT
    title: 'UNKNOWN',
    color: '#000000',
  },
  {
    // 1 COMMON
    title: 'Common',
    color: '#000000',
  },
  {
    // 2 UNCOMMON
    title: 'Uncommon',
    color: '#7ac52f',
  },
  {
    // 3 RARE
    title: 'Rare',
    color: '#3880ec',
  },
  {
    // 4 EPIC
    title: 'Epic',
    color: '#C200D3',
  },
  {
    // 5
    title: 'Legendary',
    color: '#FFB226',
  },
];
