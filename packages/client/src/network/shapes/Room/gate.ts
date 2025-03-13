import { EntityID, EntityIndex, HasValue, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition, getCondition } from '../Conditional';
import { hashArgs } from '../utils';

export const getGatesBetween = (
  world: World,
  components: Components,
  to: number,
  from: number
): Condition[] => {
  const gatesGeneral = getGates(world, components, to, 0);
  const gatesBetween = getGates(world, components, to, from);
  return [...gatesGeneral, ...gatesBetween];
};

// query Gate Entities for a Room/Room pair
export const queryGates = (
  components: Components,
  toIndex: number,
  fromIndex: number
): EntityIndex[] => {
  const { ToID, FromID } = components;
  const toQuery = [
    HasValue(ToID, { value: genGateAnchorTo(toIndex) }),
    HasValue(FromID, { value: fromIndex == 0 ? '0x00' : genGateAnchorFrom(fromIndex) }),
  ];
  return Array.from(runQuery(toQuery));
};

// get the Gates between two Rooms
export const getGates = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Condition[] => {
  const entities = queryGates(components, toIndex, fromIndex);
  return entities.map((index): Condition => getCondition(world, components, index));
};

// generate the EntityID of the Gate Anchor to a Room
export const genGateAnchorTo = (index: number): EntityID => {
  return hashArgs(['room.gate.to', index], ['string', 'uint32']);
};

// generate the EntityID of the Gate Anchor from a Room
export const genGateAnchorFrom = (index: number): EntityID => {
  return hashArgs(['room.gate.from', index], ['string', 'uint32']);
};
