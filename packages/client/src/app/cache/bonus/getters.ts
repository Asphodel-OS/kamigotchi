import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { BonusInstance, genBonusEndAnchor, queryBonusForParent } from 'network/shapes/Bonus';
import { getInstance } from './base';

const AnchorToInstances = new Map<EntityID, EntityIndex[]>();

const QueryUpdateTs = new Map<EntityID, number>();

export const getForEndType = (
  world: World,
  components: Components,
  endType: string,
  holder: EntityIndex,
  update: number
): BonusInstance[] => {
  const holderID = world.entities[holder];
  const queryID = genBonusEndAnchor(endType, holderID);
  const instances = queryByParent(components, queryID, update);
  return instances.map((instance) => getInstance(world, components, instance));
};

const queryByParent = (
  components: Components,
  queryID: EntityID,
  update: number
): EntityIndex[] => {
  const now = Date.now();
  const updateTs = QueryUpdateTs.get(queryID) ?? 0;
  const updateDelta = (now - updateTs) / 1000;
  if (updateDelta > update) {
    QueryUpdateTs.set(queryID, now);
    // todo? global query retrieval similar to components.ts?
    AnchorToInstances.set(queryID, queryBonusForParent(components, queryID));
  }
  return AnchorToInstances.get(queryID) ?? [];
};
