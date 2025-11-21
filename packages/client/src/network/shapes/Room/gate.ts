import { EntityID, EntityIndex, getComponentValue, HasValue, runQuery, World } from 'engine/recs';

import { Components } from 'network/';
import { getCondition } from '../Conditional';
import { hashArgs } from '../utils';
import { Gate } from './types';

export const getGatesBetween = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Gate[] => {
  const gates = getGates(world, components, toIndex);
  return filterGates(gates, fromIndex);
};

// query all gate entities for a Room
export const queryGates = (components: Components, toIndex: number): EntityIndex[] => {
  const { ToID } = components;

  const toQuery = [HasValue(ToID, { value: genGateAnchorTo(toIndex) })];
  let gates = Array.from(runQuery(toQuery)); // querying from all rooms

  return gates;
};

export const filterGates = (gates: Gate[], sourceRoom: number): Gate[] => {
  return gates.filter((gate) => {
    // gates from either all or specified room
    return !gate.fromRoom || gate.fromRoom === sourceRoom;
  });
};

// gets all gates, including specified fromRooms
export const getGates = (world: World, components: Components, toIndex: number): Gate[] => {
  const { SourceID } = components;

  const entities = queryGates(components, toIndex);
  return entities.map((index): Gate => {
    const condition = getCondition(world, components, index);
    const rawFromRoom = getComponentValue(SourceID, index)?.value;
    const fromRoom = rawFromRoom ? Number(rawFromRoom) * 1 : undefined;
    return { ...condition, fromRoom };
  });
};

// generate the EntityID of the Gate Anchor to a Room
export const genGateAnchorTo = (index: number): EntityID => {
  return hashArgs(['room.gate.to', index], ['string', 'uint32']);
};

// generate the EntityID of the Gate Anchor from a Room
export const genGateAnchorFrom = (index: number): EntityID => {
  return hashArgs(['room.gate.from', index], ['string', 'uint32']);
};
