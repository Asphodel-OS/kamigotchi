import { EntityID, EntityIndex, World } from 'engine/recs';

import { Components } from 'network/';
import { BonusInstance, genBonusEndAnchor, queryBonusForParent } from 'network/shapes/Bonus';
import { getInstance } from './base';

const AnchorToInstances = new Map<EntityID, EntityIndex[]>();

const QueryUpdateTs = new Map<EntityID, number>();

const EQUIPMENT_SLOTS = ['Head_Slot', 'Body_Slot', 'Hands_Slot', 'Passport_slot', 'Kami_Pet_Slot'];

export const getTemp = (
  world: World,
  components: Components,
  holder: EntityIndex,
  update: number
) => {
  // todo: add SOURCE to bonus shape. queries based on end type for now
  const equipmentBonuses = EQUIPMENT_SLOTS.flatMap((slot) =>
    getForEndType(world, components, `ON_UNEQUIP_${slot}`, holder, update)
  );

  return [
    ...getForEndType(world, components, 'UPON_HARVEST_ACTION', holder, update),
    ...getForEndType(world, components, 'UPON_LIQUIDATION', holder, update),
    ...getForEndType(world, components, 'UPON_DEATH', holder, update),
    ...getForEndType(world, components, 'UPON_KILL_OR_KILLED', holder, update),
    ...equipmentBonuses,
  ];
};

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
  return instances.map((instance) => ({
    ...getInstance(world, components, instance),
    endType,
  }));
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
