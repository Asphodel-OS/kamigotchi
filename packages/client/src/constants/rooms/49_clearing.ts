import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/49_clearing';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room49: Room = {
  index: 49,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
