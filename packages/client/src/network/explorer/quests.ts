import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { queryAccountByIndex } from 'network/shapes/Account';
import {
  getQuest,
  getQuestByIndex,
  queryAcceptedQuests,
  queryRegistryQuests,
} from 'network/shapes/Quest';

export const quests = (world: World, components: Components) => {
  return {
    all: () => {
      const entities = queryRegistryQuests(components);
      const quests = entities.map((entity) => getQuest(world, components, entity));
      return quests.sort((a, b) => a.index - b.index);
    },
    get: (entity: EntityIndex) => getQuest(world, components, entity),
    getByIndex: (index: number) => getQuestByIndex(world, components, index),
    getForAccount: (accountIndex: number) => {
      const accEntity = queryAccountByIndex(components, accountIndex) as EntityIndex;
      const accountID = world.entities[accEntity];
      const entities = queryAcceptedQuests(components, accountID);
      const quests = entities.map((entity) => getQuest(world, components, entity));
      return quests.sort((a, b) => a.index - b.index);
    },
    indices: () => [...new Set(Array.from(components.QuestIndex.values.value.values()))],
  };
};
