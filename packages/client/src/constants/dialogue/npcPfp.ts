import { NpcImages } from 'assets/images/npcs';
import { NpcPfps } from 'assets/images/npcs/pfp';

// mood art that maps to a specific headshot (each Dimidiatus mask has its own)
const MoodPfps: Record<string, string> = {
  [NpcImages['dimidiatus_laugh.png']]: NpcPfps['dimidiatus a'],
  [NpcImages['dimidiatus_frown.png']]: NpcPfps['dimidiatus b'],
};

export const getNpcPfp = (name: string, moodImg?: string): string | undefined =>
  (moodImg && MoodPfps[moodImg]) || NpcPfps[name.trim().toLowerCase()];
