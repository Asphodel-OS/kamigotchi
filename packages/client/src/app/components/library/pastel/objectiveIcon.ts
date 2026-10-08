import { rooms } from 'constants/rooms';
import { Condition } from 'network/shapes/Conditional';
import { DetailedEntity } from 'network/shapes/utils';

export type ObjectiveIcon = { src: string; kind: 'item' | 'room' };

// objective types whose index is an item, or a room (node indices match their room)
const ITEM_TYPES = [
  'ITEM',
  'ITEM_BURN',
  'ITEM_SPEND',
  'ITEM_TOTAL',
  'CRAFT_ITEM',
  'DROPTABLE_ITEM_TOTAL',
];
const ROOM_TYPES = ['ROOM', 'SCAV_CLAIM_NODE', 'HARVEST_TIME', 'HARVEST_TIME_MOONSIDE'];

// icon for an objective tied to an item or a room; generic objectives get none
export const getObjectiveIcon = (
  objective: Condition,
  describeEntity: (type: string, index: number) => DetailedEntity
): ObjectiveIcon | undefined => {
  const { type, index } = objective.target;
  if (!index) return;
  if (ITEM_TYPES.includes(type)) return { src: describeEntity('ITEM', index).image, kind: 'item' };
  if (ROOM_TYPES.includes(type)) {
    const bg = rooms[index]?.backgrounds?.[0];
    if (bg) return { src: bg, kind: 'room' };
  }
};
