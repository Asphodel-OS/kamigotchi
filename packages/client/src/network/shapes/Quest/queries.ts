import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';

export interface QueryOptions {
  account?: EntityID;
  completed?: boolean;
  index?: number;
  registry?: boolean;
}

// Query for Entity Indices of Quests, depending on the options provided
export const query = (components: Components, options: QueryOptions): EntityIndex[] => {
  const { OwnsQuestID, IsComplete, IsQuest, IsRegistry, QuestIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsQuest)];
  if (options?.registry) toQuery.push(Has(IsRegistry));
  if (options?.account) toQuery.push(HasValue(OwnsQuestID, { value: options.account }));
  if (options?.index) toQuery.push(HasValue(QuestIndex, { value: options.index }));
  if (options?.completed !== undefined) {
    if (options?.completed) toQuery.push(Has(IsComplete));
    else toQuery.push(Not(IsComplete));
  }

  return Array.from(runQuery(toQuery));
};

export const queryAccepted = (components: Components, accountID: EntityID): EntityIndex[] => {
  return query(components, { account: accountID });
};

// get the list of Completed Quest EntityIndices for an Account
export const queryCompleted = (components: Components, accountID: EntityID): EntityIndex[] => {
  return query(components, { account: accountID, completed: true });
};

// get the list of Ongoing Quest EntityIndices for an Account
export const queryOngoing = (components: Components, accountID: EntityID): EntityIndex[] => {
  return query(components, { account: accountID, completed: false });
};

export const queryRegistry = (components: Components): EntityIndex[] => {
  return query(components, { registry: true });
};
