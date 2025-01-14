import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  getQuest,
  meetsObjectives,
  meetsRequirements,
  queryQuests,
  Quest,
} from 'network/shapes/Quest';

export const QuestCache = new Map<EntityIndex, Quest>();
export let lastRequestSize = 0;

export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  requestSize: number
) => {
  if (!QuestCache.has(entity)) process(world, components, entity);
  if (requestSize !== lastRequestSize) updateAll(world, components, requestSize);
  return QuestCache.get(entity)!;
};

export const process = (world: World, components: Components, entity: EntityIndex) => {
  const Quest = getQuest(world, components, entity);
  QuestCache.set(entity, Quest);
};

export const updateAll = (world: World, components: Components, requestSize: number) => {
  lastRequestSize = requestSize;
  queryQuests(components, {}).map((entityIndex) => {
    const quest = get(world, components, entityIndex, lastRequestSize);
    quest.meetsRequirements = meetsRequirements(quest);
    quest.meetsObjectives = meetsObjectives(quest);
  });
};
