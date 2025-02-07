// represents the configuration of a visual media asset in a room
export interface RoomAsset {
  name: string;
  coordinates?: { x1: number; y1: number; x2: number; y2: number };
  dialogue?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>; // TODO: wipe this in favor of inputs
}

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
