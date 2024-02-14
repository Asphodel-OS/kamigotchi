import { backgroundDefault, path15, path19, path20 } from 'assets/images/rooms/18_cave-crossroads';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room18: Room = {
  location: 18,
  background: {
    key: 'bg_room18',
    path: backgroundDefault,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      key: 'cavefloor',
      path: path15,
      offset: { x: 25, y: 53.1 },
      dialogue: 181,
    },
    {
      key: 'cavecrossleft',
      path: path19,
      offset: { x: -46, y: -5.8 },
      dialogue: 182,
    },
    {
      key: 'cavecrossright',
      path: path20,
      offset: { x: 18.5, y: -19.7 },
      dialogue: 183,
    },
  ],
};
