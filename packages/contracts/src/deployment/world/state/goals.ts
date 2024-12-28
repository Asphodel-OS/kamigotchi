import { AdminAPI } from '../admin';

export async function initGoals(api: AdminAPI) {
  //   await api.goal.create(
  //     1,
  //     'A hole in reality?',
  //     `The path beyond this point is blocked by some kind of…. glitched-out gate?

  //       You won’t be able to pass without using MUSU to stabilize this hole in reality. Looks like this one is going to need to be a team effort…`,
  //     47,
  //     'ITEM',
  //     'CURR_MIN',
  //     MUSU_INDEX,
  //     50000
  //   );
  //   await api.goal.add.reward.display(1, 'Door unlock');
  //   await api.goal.add.reward.basic(1, 'Bronze', 50, 'ITEM', 11201, 1);
  //   await api.goal.add.reward.basic(1, 'Bronze', 50, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(1, 'Silver', 250, 'ITEM', 11202, 2);
  //   await api.goal.add.reward.basic(1, 'Silver', 250, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(1, 'Gold', 500, 'ITEM', 11203, 3);
  //   await api.goal.add.reward.basic(1, 'Gold', 500, 'REPUTATION', 1, 10);

  //   await api.goal.create(
  //     2,
  //     'Void of Scrap',
  //     `Looks like you’d be able to get deeper into the scrapyard…. if it weren’t for this inconvenient hole in reality.

  //       You’ll need to contribute MUSU to open this path forward.`,
  //     34,
  //     'ITEM',
  //     'CURR_MIN',
  //     MUSU_INDEX,
  //     500000
  //   );
  //   await api.goal.add.reward.display(2, 'Door unlock');
  //   await api.goal.add.reward.basic(2, 'Bronze', 500, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(2, 'Silver', 2500, 'REPUTATION', 1, 10);
  //   await api.goal.add.reward.basic(2, 'Gold', 5000, 'REPUTATION', 1, 10);

  //   await api.goal.create(
  //     3,
  //     'Deep-Forest Ritual',
  //     `The insect hive here has begun to take on a strange aura. Sacred sites like this demand tribute….

  //     By contributing MUSU to the ritual, you will be rewarded. With enough MUSU, a new path will open for all of us.`,
  //     10,
  //     'ITEM',
  //     'CURR_MIN',
  //     MUSU_INDEX,
  //     1000000
  //   );
  //   await api.goal.add.reward.display(3, 'Door unlock');
  //   await api.goal.add.reward.basic(3, 'Bronze', 1000, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(3, 'Bronze', 1000, 'ITEM', 11203, 1);
  //   await api.goal.add.reward.basic(3, 'Silver', 5000, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(3, 'Gold', 10000, 'REPUTATION', 1, 10);

  //   await api.goal.create(
  //     4,
  //     'Shrine to Nature',
  //     `It looks like some sort of idol has sprouted from the cockpit…

  // The idol needs tribute. Provide it with the resources it needs, and another way will open in the forest.`,
  //     54,
  //     'ITEM',
  //     'CURR_MIN',
  //     104, // pine cones
  //     2500
  //   );
  //   await api.goal.add.reward.basic(4, 'Bronze', 1, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(4, 'Bronze', 1, 'ITEM', 11203, 1);
  //   await api.goal.add.reward.basic(4, 'Silver', 5, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(4, 'Silver', 5, 'ITEM', 100001, 1);
  //   await api.goal.add.reward.basic(4, 'Gold', 20, 'REPUTATION', 1, 5);
  //   await api.goal.add.reward.basic(4, 'Gold', 20, 'ITEM', 11110, 1);

  //   await api.goal.create(
  //     5,
  //     'Expanding Inventory',
  //     `Hello…. I’ve discovered that, with enough MUSU, it should be possible for me to develop a new form of magic that allows teleportation directly to this shop.

  //   I need your help to fund my R&D department so I can sell you this innovative new item! `,
  //     13,
  //     'ITEM',
  //     'CURR_MIN',
  //     MUSU_INDEX,
  //     1500000
  //   );
  //   await api.goal.add.reward.display(5, 'Shop Inventory Expanded');
  //   await api.goal.add.reward.basic(5, 'Bronze', 1000, 'REPUTATION', 2, 5);
  //   await api.goal.add.reward.basic(5, 'Bronze', 1000, 'ITEM', 21100, 10);
  //   await api.goal.add.reward.basic(5, 'Silver', 5000, 'REPUTATION', 2, 10);
  //   await api.goal.add.reward.basic(5, 'Silver', 5000, 'ITEM', 11204, 3);
  //   await api.goal.add.reward.basic(5, 'Gold', 20000, 'REPUTATION', 2, 10);

  //   await api.goal.create(
  //     6,
  //     'Holy Gate',
  //     'The Gate here is glowing and ready to receive MUSU.  Giving proper tribute here will open a path. But it won’t be easy… Still, you should do your part.',
  //     3,
  //     'ITEM',
  //     'CURR_MIN',
  //     MUSU_INDEX,
  //     2500000
  //   );
  //   await api.goal.add.reward.display(6, 'Door unlock');
  //   await api.goal.add.reward.basic(6, 'Bronze', 2500, 'REPUTATION', 1, 10);
  //   await api.goal.add.reward.basic(6, 'Bronze', 2500, 'ITEM', 11204, 1);
  //   await api.goal.add.reward.basic(6, 'Silver', 7500, 'REPUTATION', 1, 10);
  //   await api.goal.add.reward.basic(6, 'Gold', 25000, 'REPUTATION', 1, 5);

  // await api.goal.create(
  //   7,
  //   'Cairn for the Fallen',
  //   'The air in this Clearing has become thick with eerie energy…. it seems like the huge numbers of Kami killed here have left an imprint. You feel like it should be channeled toward something.',
  //   49,
  //   'ITEM',
  //   'CURR_MIN',
  //   MUSU_INDEX,
  //   250000
  // );
  // await api.goal.add.reward.basic(7, 'Bronze', 1000, 'REPUTATION', 1, 5);
  // await api.goal.add.reward.basic(7, 'Silver', 2500, 'REPUTATION', 1, 5);
  // await api.goal.add.reward.basic(7, 'Gold', 5000, 'REPUTATION', 1, 5);

  await api.goal.create(
    8,
    'Burn the Goat',
    `There’s a new object on the path. It’s a straw goat, something from old Yuletide tradition. It seems so lonely standing there in the moonlight! Where’s all the warmth and good cheer?

What if you all set a ton of candles around this spot? It’ll be like everyone’s here with the old goat keeping it company!`,
    55,
    'ITEM',
    'CURR_MIN',
    116,
    33333
  );
  await api.goal.add.reward.basic(8, 'Bronze', 3, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(8, 'Bronze', 3, 'ITEM', 11120, 1);
  await api.goal.add.reward.basic(8, 'Silver', 33, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(8, 'Silver', 33, 'ITEM', 11120, 2);
  await api.goal.add.reward.basic(8, 'Gold', 99, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(8, 'Gold', 99, 'ITEM', 11130, 3);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.delete(indices[i]);
  }
}
