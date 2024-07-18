import { bgPlaytest } from 'assets/images/rooms/20_ancient-riverbed';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room20: Room = {
  index: 20,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
