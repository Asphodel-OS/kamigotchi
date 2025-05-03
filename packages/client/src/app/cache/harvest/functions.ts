import { Harvest } from 'network/shapes/Harvest';
import { NullItem } from 'network/shapes/Item';

// get the item being harvested from a harvest. assume node is populated
export const getItem = (harvest: Harvest) => {
  return harvest.node?.drops[0] ?? NullItem;
};
