import {
  backgroundShop,
  objectGate,
  objectHollowStump,
  objectShopDoor,
} from 'assets/images/rooms/2_tree-tunnel';
import { opening } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';


export const room2: Room = {
  location: 2,
  background: {
    key: 'bg_room002',
    path: backgroundShop,
  },
  music: {
    key: 'opening',
    path: opening,
  },
  objects: [
    {
      key: 'hollowstump',
      path: objectHollowStump,
      offset: { x: -48.5, y: 29.5 },
      dialogue: [
        'Mushrooms of all shapes and sizes are growing on this hollow stump. Its one remaining branch reaches out in a greeting.',
        'You hear birds chirping inside the thick foliage.',
        'All in all, the forest seems to be in good health.',
      ],
    },
    {
      key: 'gate',
      path: objectGate,
      offset: { x: -39.5, y: -33.5 },
      dialogue: [
        'Through the opening, you can see the sun shining down on a large gate. A good place to catch your breath, perhaps.',
      ],
    },
    {
      key: 'shopdoor',
      path: objectShopDoor,
      offset: { x: 5, y: -7 },
      dialogue: [
        'An otherworldy door is suspended in mid - air! There\'s a hair - raising energy emanating from it....',
        'You look around for the shop it should be attached to. It looks mostly the same from the other side, except for the sign says "POHS".',
        'No telling where you\'ll end up if you go through.... but it feels safest to enter from the front.',
      ],
    },
  ],
};