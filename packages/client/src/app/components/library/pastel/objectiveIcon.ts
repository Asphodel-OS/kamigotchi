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

const QUOTED = /"([^"]+)"|“([^”]+)”/g;

// icon for an objective tied to an item or a room; generic objectives get none.
// a room named in quotes in the text wins over the target (e.g. "use X in <room>" targets the room it leads to)
export const getObjectiveIcon = (
  objective: Condition & { name?: string },
  describeEntity: (type: string, index: number) => DetailedEntity,
  findRoomByName?: (name: string) => number | undefined
): ObjectiveIcon | undefined => {
  const { type, index } = objective.target;
  if (!index) return;
  if (ITEM_TYPES.includes(type)) return { src: describeEntity('ITEM', index).image, kind: 'item' };
  if (ROOM_TYPES.includes(type)) {
    const quoted = [...(objective.name ?? '').matchAll(QUOTED)].map((m) => m[1] ?? m[2]);
    const named = findRoomByName && quoted.map(findRoomByName).find((i) => i !== undefined);
    const bg = rooms[named ?? index]?.backgrounds?.[0];
    if (bg) return { src: bg, kind: 'room' };
  }
};
