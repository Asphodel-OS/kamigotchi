import { AdminAPI } from '../admin';
import { MUSU_INDEX } from './utils';

export async function initGoals(api: AdminAPI) {
  await api.goal.create(
    1,
    'A hole in reality?',
    `The path beyond this point is blocked by some kind of…. glitched-out gate?

    You won’t be able to pass without using MUSU to stabilize this hole in reality. Looks like this one is going to need to be a team effort…`,
    47,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    20000
  );
  await api.goal.add.reward(1, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, [], [], 0);
  await api.goal.add.reward(1, 'Bronze', 100, 'ITEM', 'REWARD', 106, [], [], 1);
  await api.goal.add.reward(1, 'Bronze', 100, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(1, 'Silver', 300, 'ITEM', 'REWARD', 105, [], [], 2);
  await api.goal.add.reward(1, 'Silver', 300, 'REPUTATION', 'REWARD', 1, [], [], 10);
  await api.goal.add.reward(1, 'Gold', 1000, 'ITEM', 'REWARD', 104, [], [], 3);
  await api.goal.add.reward(1, 'Gold', 1000, 'REPUTATION', 'REWARD', 1, [], [], 25);

  await api.goal.create(
    2,
    'Void of Scrap',
    `Looks like you’d be able to get deeper into the scrapyard…. if it weren’t for this inconvenient hole in reality.

    You’ll need to contribute MUSU to open this path forward.`,
    34,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    100000
  );
  await api.goal.add.reward(2, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, [], [], 0);
  await api.goal.add.reward(2, 'Bronze', 500, 'REPUTATION', 'REWARD', 1, [], [], 10);
  await api.goal.add.reward(2, 'Silver', 2500, 'REPUTATION', 'REWARD', 1, [], [], 20);
  await api.goal.add.reward(2, 'Gold', 5000, 'REPUTATION', 'REWARD', 1, [], [], 50);

  await api.goal.create(
    3,
    'Deep-Forest Ritual',
    `The insect hive here has begun to take on a strange aura. Sacred sites like this demand tribute….

  By contributing MUSU to the ritual, you will be rewarded. With enough MUSU, a new path will open for all of us.`,
    10,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    500000
  );
  await api.goal.add.reward(3, 'Community', 0, 'Door unlock', 'DISPLAY_ONLY', 0, [], [], 0);
  await api.goal.add.reward(3, 'Bronze', 1000, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(3, 'Bronze', 1000, 'ITEM', 'REWARD', 104, [], [], 1);
  await api.goal.add.reward(3, 'Silver', 5000, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(3, 'Silver', 5000, 'ITEM', 'REWARD', 115, [], [], 1);
  await api.goal.add.reward(3, 'Gold', 10000, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(3, 'Gold', 10000, 'ITEM', 'REWARD', 114, [], [], 1);

  await api.goal.create(
    4,
    'Shrine to Nature',
    `It’s unclear what this object is. It looks like…. some sort of idol has sprouted from the cockpit?

  Once again, you sense this object needs… tribute. But its purpose is unclear. And for some reason, it needs Pine Cones. `,
    54,
    'ITEM',
    'CURR_MIN',
    11008, // pine cones
    1000
  );
  await api.goal.add.reward(4, 'Bronze', 1, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(4, 'Bronze', 1, 'ITEM', 'REWARD', 11005, [], [], 5);
  await api.goal.add.reward(4, 'Silver', 5, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(4, 'Silver', 5, 'ITEM', 'REWARD', 20001, [], [], 1);
  await api.goal.add.reward(4, 'Gold', 20, 'REPUTATION', 'REWARD', 1, [], [], 5);
  await api.goal.add.reward(4, 'Gold', 20, 'ITEM', 'REWARD', 112, [], [], 2);

  await api.goal.create(
    5,
    'Expanding Inventory',
    `Hello…. I’ve discovered that, with enough MUSU, it should be possible for me to develop a new form of magic that allows teleportation directly to this shop. 

I need your help to fund my R&D department so I can sell you this innovative new item! `,
    13,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    750000
  );
  await api.goal.add.reward(
    5,
    'Community',
    0,
    'Shop Inventory Expanded',
    'DISPLAY_ONLY',
    0,
    [],
    [],
    0
  );
  await api.goal.add.reward(5, 'Bronze', 3000, 'REPUTATION', 'REWARD', 2, [], [], 5);
  await api.goal.add.reward(5, 'Bronze', 3000, 'ITEM', 'REWARD', 119, [], [], 10);
  await api.goal.add.reward(5, 'Silver', 7500, 'REPUTATION', 'REWARD', 2, [], [], 10);
  await api.goal.add.reward(5, 'Silver', 7500, 'ITEM', 'REWARD', 117, [], [], 3);
  await api.goal.add.reward(5, 'Gold', 20000, 'REPUTATION', 'REWARD', 2, [], [], 10);
  await api.goal.add.reward(5, 'Gold', 20000, 'ITEM', 'REWARD', 115, [], [], 1);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.delete(indices[i]);
  }
}
