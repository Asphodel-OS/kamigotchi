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
import { Inventory, queryInventoryX } from './Inventory';


/////////////////
// GETTERS

export const getRegistryQuests = (layers: Layers): Quest[] => {
  return queryQuestsX(layers, { registry: true });
};

// get the ongoing quests for an account
export const getOngoingQuests = (layers: Layers, accountEntityID: EntityID): Quest[] => {
  return queryQuestsX(layers, { account: accountEntityID, completed: false });
}

// get the completed quests for an account
export const getCompletedQuests = (layers: Layers, accountEntityID: EntityID): Quest[] => {
  return queryQuestsX(layers, { account: accountEntityID, completed: true });
}


/////////////////
// SHAPES

export interface Quest {
  id: EntityID;
  index: number;
  name: string;
  description: string;
  complete: boolean;
  requirements: Requirement[];
  objectives: Objective[];
  rewards: Reward[];
}

// the Target of a Condition (Objective, Requirement, Reward)
export interface Target {
  type: string;
  index?: number;
  value?: number;
}

export interface Objective {
  id: EntityID;
  index: number;
  name: string;
  logic: string;
  target: Target;
}

export interface Requirement {
  id: EntityID;
  logic?: string;
  target: Target;
}

export interface Reward {
  id: EntityID;
  target: Target;
}

// Get a Quest Registry object, complete with all Requirements, Objectives, and Rewards
const getQuest = (layers: Layers, entityIndex: EntityIndex): Quest => {
  const {
    network: {
      components: {
        IsComplete,
        IsQuest,
        IsRegistry,
        Description,
        Name,
        QuestIndex,
      },
      world,
    },
  } = layers;

  const questIndex = getComponentValue(QuestIndex, entityIndex)?.value || 0 as number;
  const registryIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsQuest),
      HasValue(QuestIndex, { value: questIndex })
    ])
  )[0];

  return {
    id: world.entities[entityIndex],
    index: questIndex,
    name: getComponentValue(Name, registryIndex)?.value || '' as string,
    description: getComponentValue(Description, registryIndex)?.value || '' as string,
    complete: hasComponent(IsComplete, entityIndex) || false as boolean,
    requirements: queryQuestRequirements(layers, questIndex),
    objectives: queryQuestObjectives(layers, questIndex),
    rewards: queryQuestRewards(layers, questIndex),
  };
}

// Get a Requirement Registry object
const getRequirement = (layers: Layers, entityIndex: EntityIndex): Requirement => {
  const {
    network: {
      components: {
        Index,
        LogicType,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let requirement: Requirement = {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || '' as string,
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const typesWithIndex = ["QUEST"];
  if (typesWithIndex.indexOf(requirement.target.type) >= 0) {
    requirement.target.index = getComponentValue(Index, entityIndex)?.value || 0 as number;
  }

  const typesWithValue = ["COIN", "LEVEL", "KAMI", "QUEST", "ROOM"];
  if (typesWithValue.indexOf(requirement.target.type) >= 0) {
    requirement.target.value = getComponentValue(Value, entityIndex)?.value || 0 as number;
  }

  return requirement;
}

// Get an Objective Registry object
const getObjective = (layers: Layers, entityIndex: EntityIndex): Objective => {
  const {
    network: {
      components: {
        Index,
        LogicType,
        Name,
        ObjectiveIndex,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let objective: Objective = {
    id: world.entities[entityIndex],
    index: getComponentValue(ObjectiveIndex, entityIndex)?.value || 0 as number,
    name: getComponentValue(Name, entityIndex)?.value || '' as string,
    logic: getComponentValue(LogicType, entityIndex)?.value || '' as string,
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const typesWithIndex = ["ITEM", "NODE", "NPC", "ROOM"];
  if (typesWithIndex.indexOf(objective.target.type) >= 0) {
    objective.target.index = getComponentValue(Index, entityIndex)?.value || 0 as number;
  }

  const typesWithValue = ["COIN", "ITEM", "NODE", "ROOM"];
  if (typesWithValue.indexOf(objective.target.type) >= 0) {
    objective.target.value = getComponentValue(Value, entityIndex)?.value || 0 as number;
  }

  return objective;
}

// Get a Reward Registry object
const getReward = (layers: Layers, entityIndex: EntityIndex): Reward => {
  const {
    network: {
      components: {
        Index,
        Type,
        Value,
      },
      world,
    },
  } = layers;


  let reward: Reward = {
    id: world.entities[entityIndex],
    target: {
      type: getComponentValue(Type, entityIndex)?.value || '' as string,
    },
  }

  const typesWithIndex = ["FOOD", "REVIVE", "MOD", "EQUIP"];
  if (typesWithIndex.indexOf(reward.target.type) >= 0) {
    reward.target.index = getComponentValue(Index, entityIndex)?.value || 0 as number;
  }

  const typesWithValue = ["COIN", "EXPERIENCE", "FOOD", "REVIVE", "MOD", "EQUIP"];
  if (typesWithValue.indexOf(reward.target.type) >= 0) {
    reward.target.value = getComponentValue(Value, entityIndex)?.value || 0 as number;
  }

  return reward;

}

/////////////////
// QUERIES

export interface QueryOptions {
  account?: EntityID;
  completed?: boolean;
  index?: number;
  registry?: boolean;
}

// Query for Entity Indices of Quests, depending on the options provided
const queryQuestsX = (
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

// Get the Entity Indices of the Requirements of a Quest
const queryQuestRequirements = (layers: Layers, questIndex: number): Requirement[] => {
  const {
    network: {
      components: { IsRegistry, IsRequirement, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsRequirement),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Requirement => getRequirement(layers, entityIndex)
  );
}

// Get the Entity Indices of the Objectives of a Quest
const queryQuestObjectives = (layers: Layers, questIndex: number): Objective[] => {
  const {
    network: {
      components: { IsObjective, IsRegistry, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsObjective),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map((index): Objective => getObjective(layers, index));
}

// Get the Entity Indices of the Rewards of a Quest
const queryQuestRewards = (layers: Layers, questIndex: number): Reward[] => {
  const {
    network: {
      components: { IsRegistry, IsReward, QuestIndex },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      Has(IsReward),
      HasValue(QuestIndex, { value: questIndex })
    ])
  );

  return entityIndices.map(
    (entityIndex): Reward => getReward(layers, entityIndex)
  );
}


