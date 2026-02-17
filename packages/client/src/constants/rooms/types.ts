import { Condition } from 'network/shapes/Conditional/types';
import { EntityID } from 'engine/recs';

// represents the configuration of a visual media asset in a room
export interface RoomAsset {
  name: string;
  coordinates?: { x1: number; y1: number; x2: number; y2: number };
  dialogue?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>; // TODO: wipe this in favor of inputs
  requirements?: Condition[];
  backgrounds?: string[];
}

// Currently, clickbox data is not represented on-chain and is purely handled by the client
// Therefore, a clickbox condition does not currently have an entity ID in the ECS world
const EMPTY_ID = '0' as EntityID;

export const questComplete = (questIndex: number): Condition => ({
  id: EMPTY_ID,
  logic: 'BOOL_IS',
  target: { type: 'QUEST', index: questIndex },
});

// represents the music in a room
interface Music {
  key: string;
  path: string;
}

// represents a room in all its glory
export interface Room {
  index: number;
  backgrounds: string[];
  objects: RoomAsset[];
  music?: Music;
}
