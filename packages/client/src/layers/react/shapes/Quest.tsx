import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
  Not,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';

// standardized shape of Traits on an Entity
export interface Quest {
  id: EntityID;
  index: number;
  name: string;
  complete: boolean;
  requirements: Condition[];
  objectives: Condition[];
  rewards: Condition[];
}

export interface Condition {
  name: string;
  type: string;
  logic: string;
  balance: number;
}

export interface QueryOptions {
  account?: EntityID;
  completed?: boolean;
  index?: number;
  registry?: boolean;
}

export const getQuest = (layers: Layers, index: EntityIndex): Quest => {
  const {
    network: {
      components: {
        IsComplete,
        IsQuest,
        IsRegistry,
        Name,
        QuestIndex,
      },
      world,
    },
  } = layers;

  const questIndex = getComponentValue(QuestIndex, index)?.value || 0 as number;
  const registryIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsQuest),
      HasValue(QuestIndex, { value: questIndex })
    ])
  )[0];

  return {
    id: world.entities[index],
    index: questIndex,
    name: getComponentValue(Name, registryIndex)?.value || '' as string,
    complete: hasComponent(IsComplete, index) || false as boolean,
    requirements: getRequirements(layers, questIndex),
    objectives: getObjectives(layers, questIndex),
    rewards: getRewards(layers, questIndex),
  };
}

export const getCondition = (layers: Layers, index: EntityIndex): Condition => {
  const {
    network: {
      components: {
        Balance,
        LogicType,
        Name,
        Type,
      },
    },
  } = layers;

  return {
    name: getComponentValue(Name, index)?.value || '' as string,
    type: getComponentValue(Type, index)?.value || '' as string,
    logic: getComponentValue(LogicType, index)?.value || '' as string,
    balance: getComponentValue(Balance, index)?.value || 0 as number,
  }
}

/////////////////////
// SPECIFIC QUERIES

export const getRewards = (layers: Layers, index: number): Condition[] => {
  const {
    network: {
      components: {
        IsReward,
        QuestIndex,
      },
    },
  } = layers;

  const raw = Array.from(
    runQuery([
      Has(IsReward),
      HasValue(QuestIndex, { value: index })
    ])
  );

  return raw.map(
    (index): Condition => getCondition(layers, index)
  );
}

export const getRequirements = (layers: Layers, index: number): Condition[] => {
  const {
    network: {
      components: {
        IsRequirement,
        QuestIndex,
      },
    },
  } = layers;


  const raw = Array.from(
    runQuery([
      Has(IsRequirement),
      HasValue(QuestIndex, { value: index })
    ])
  );

  return raw.map(
    (index): Condition => getCondition(layers, index)
  );
}

export const getObjectives = (layers: Layers, index: number): Condition[] => {
  const {
    network: {
      components: {
        IsObjective,
        QuestIndex,
      },
    },
  } = layers;

  const raw = Array.from(
    runQuery([
      Has(IsObjective),
      HasValue(QuestIndex, { value: index })
    ])
  );

  return raw.map(
    (index): Condition => getCondition(layers, index)
  );
}

/////////////////////
// GENERAL QUERIES

export const queryQuestsX = (
  layers: Layers,
  options: QueryOptions,
): Quest[] => {
  const {
    network: {
      components: {
        AccountID,
        IsComplete,
        IsQuest,
        IsRegistry,
        QuestIndex,
      },
    },
  } = layers;

  const toQuery: QueryFragment[] = [Has(IsQuest)];

  if (options?.account) {
    toQuery.push(HasValue(AccountID, { value: options.account }));
  }

  if (options?.registry) {
    toQuery.push(Has(IsRegistry));
  }

  if (options?.index) {
    toQuery.push(HasValue(QuestIndex, { value: options.index }));
  }

  if (options?.completed !== undefined) {
    if (options?.completed) {
      toQuery.push(Has(IsComplete));
    } else {
      toQuery.push(Not(IsComplete));
    }
  }

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): Quest => getQuest(layers, index)
  );
}