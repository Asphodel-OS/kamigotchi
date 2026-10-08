import { NpcImages } from 'assets/images/npcs';
import { NpcPfps } from 'assets/images/npcs/pfp';

// mood art that maps to a specific headshot (each Dimidiatus mask has its own)
const MoodPfps: Record<string, string> = {
  [NpcImages['dimidiatus_laugh.png']]: NpcPfps['dimidiatus a'],
  [NpcImages['dimidiatus_frown.png']]: NpcPfps['dimidiatus b'],
};

// zoom inside the portrait frame for headshots with extra margin
const PfpZoom: Record<string, number> = {
  menu: 1.2,
};

export const getNpcPfp = (name: string, moodImg?: string): string | undefined =>
  (moodImg && MoodPfps[moodImg]) || NpcPfps[name.trim().toLowerCase()];

export const getNpcPfpZoom = (name: string): number => PfpZoom[name.trim().toLowerCase()] ?? 1;
