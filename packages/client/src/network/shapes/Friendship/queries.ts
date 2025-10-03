import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { FriendState } from './types';

export interface queryOptions {
  account?: EntityID;
  target?: EntityID;
  state?: FriendState;
}

export const query = (comps: Components, options: queryOptions): EntityIndex[] => {
  const { EntityType, SourceID, TargetID, State } = comps;

  const toQuery: QueryFragment[] = [];
  if (options?.account) toQuery.push(HasValue(SourceID, { value: options.account }));
  if (options?.target) toQuery.push(HasValue(TargetID, { value: options.target }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(HasValue(EntityType, { value: 'FRIENDSHIP' }));
  return Array.from(runQuery(toQuery));
};
