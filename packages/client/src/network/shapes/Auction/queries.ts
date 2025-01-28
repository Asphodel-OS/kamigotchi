import { HasValue, runQuery } from '@mud-classic/recs';
import { Components } from 'network/components';

interface Options {
  inputItem?: number;
  outputItem?: number;
}

// query for any auctions meeting certain criteria
export const query = (components: Components, options?: Options) => {
  const { EntityType, Index, ItemIndex } = components;
  const query = [];
  query.push(HasValue(EntityType, { value: 'AUCTION' })); // we don't expect many of these
  if (options?.outputItem) query.push(HasValue(Index, { value: options.outputItem }));
  if (options?.inputItem) query.push(HasValue(ItemIndex, { value: options.inputItem }));
  return Array.from(runQuery(query));
};
