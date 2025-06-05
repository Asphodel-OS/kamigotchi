import { MUSU_INDEX } from 'constants/items';
import { Item } from 'network/shapes';

// very simple determination for now
export const isCurrency = (item: Item) => {
  return item.index === MUSU_INDEX;
};
