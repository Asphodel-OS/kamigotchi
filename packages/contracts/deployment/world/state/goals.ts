import { AdminAPI } from '../api';
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
    1000000
  );
  await api.goal.add.reward.display(1, 'Door unlock');
  await api.goal.add.reward.basic(1, 'Bronze', 500, 'ITEM', 11211, 10);
  await api.goal.add.reward.basic(1, 'Bronze', 500, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(1, 'Silver', 1000, 'ITEM', 11002, 10);
  await api.goal.add.reward.basic(1, 'Silver', 1000, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(1, 'Gold', 3333, 'ITEM', 100001, 1);
  await api.goal.add.reward.basic(1, 'Gold', 3333, 'REPUTATION', 1, 3);
  await api.goal.enable(1);

  // await api.goal.create(
  //   2,
  //   'Void of Scrap',
  //   `Looks like you’d be able to get deeper into the scrapyard…. if it weren’t for this inconvenient hole in reality.
  //       You’ll need to contribute MUSU to open this path forward.`,
  //   34,
  //   'ITEM',
  //   'CURR_MIN',
  //   MUSU_INDEX,
  //   500000
  // );
  // await api.goal.add.reward.display(2, 'Door unlock');
  // await api.goal.add.reward.basic(2, 'Bronze', 500, 'REPUTATION', 1, 5);
  // await api.goal.add.reward.basic(2, 'Silver', 2500, 'REPUTATION', 1, 10);
  // await api.goal.add.reward.basic(2, 'Gold', 5000, 'REPUTATION', 1, 10);
  // await api.goal.enable(2);

  await api.goal.create(
    3,
    'Deep-Forest Ritual',
    `The insect hive here has begun to take on a strange aura. Sacred sites like this demand tribute….
      By contributing MUSU to the ritual, you will be rewarded. With enough MUSU, a new path will open for all of us.`,
    10,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    2000000
  );
  await api.goal.add.reward.display(3, 'Door unlock');
  await api.goal.add.reward.basic(3, 'Bronze', 1000, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(3, 'Bronze', 1000, 'ITEM', 11212, 10);
  await api.goal.add.reward.basic(3, 'Silver', 2000, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(3, 'Silver', 2000, 'ITEM', 21204, 20);
  await api.goal.add.reward.basic(3, 'Gold', 6666, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(3, 'Gold', 6666, 'ITEM', 100002, 1);
  await api.goal.enable(3);

  await api.goal.create(
    4,
    'Shrine to Nature',
    `It looks like some sort of idol has sprouted from the cockpit…
  The idol needs tribute. Provide it with the resources it needs, and another way will open in the forest.`,
    54,
    'ITEM',
    'CURR_MIN',
    MUSU_INDEX,
    3000000
  );
  await api.goal.add.reward.basic(4, 'Bronze', 1500, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(4, 'Bronze', 1500, 'ITEM', 11213, 10);
  await api.goal.add.reward.basic(4, 'Silver', 3000, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(4, 'Silver', 3000, 'ITEM', 11002, 10);
  await api.goal.add.reward.basic(4, 'Silver', 3000, 'ITEM', 21204, 20);
  await api.goal.add.reward.basic(4, 'Gold', 9999, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(4, 'Gold', 9999, 'ITEM', 100003, 1);
  await api.goal.enable(4);

  await api.goal.create(
    5,
    'Breaking Through',
    `It's not reasonable to drag those boulders back and forth by yourself. There's got to be a faster way.
      Maybe we can use acoustic resonance? Something in that wired-up temple near the entrance might work.`,
    67,
    'ITEM',
    'CURR_MIN',
    6001,
    2000
  );
  await api.goal.add.reward.display(5, 'Door Unlock');
  await api.goal.add.reward.basic(5, 'Bronze', 7, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(5, 'Bronze', 7, 'ITEM', 21004, 10);
  await api.goal.add.reward.basic(5, 'Bronze', 7, 'ITEM', 11411, 1);
  await api.goal.add.reward.basic(5, 'Silver', 23, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(5, 'Silver', 23, 'ITEM', 21004, 20);
  await api.goal.add.reward.basic(5, 'Silver', 23, 'ITEM', 11411, 3);
  await api.goal.add.reward.basic(5, 'Gold', 42, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(5, 'Gold', 42, 'ITEM', 21004, 30);
  await api.goal.add.reward.basic(5, 'Gold', 42, 'ITEM', 11411, 5);
  await api.goal.enable(5);

  await api.goal.create(
    6,
    'Chopping It Up',
    `The mushrooms blocking the exits grow back so fast that even if you cut them away, they'll be back before you finish cutting.
      We need something that can have lasting physical effects.`,
    77,
    'ITEM',
    'CURR_MIN',
    6005,
    2000
  );
  await api.goal.add.reward.display(6, 'Door Unlock');
  await api.goal.add.reward.basic(6, 'Bronze', 7, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(6, 'Bronze', 7, 'ITEM', 11501, 10);
  await api.goal.add.reward.basic(6, 'Silver', 23, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(6, 'Silver', 23, 'ITEM', 11501, 15);
  await api.goal.add.reward.basic(6, 'Silver', 23, 'ITEM', 11502, 5);
  await api.goal.add.reward.basic(6, 'Gold', 42, 'REPUTATION', 1, 3);
  await api.goal.add.reward.basic(6, 'Gold', 42, 'ITEM', 11501, 25);
  await api.goal.add.reward.basic(6, 'Gold', 42, 'ITEM', 11502, 10);
  await api.goal.enable(6);

  // await api.goal.create(
  //   7,
  //   'Titanic Offering',
  //   `You should be able to squeeze past that hand, but the darkness is impenetrable. It's almost like a physical barrier.
  //     Maybe something in these caves can light it up. Even if we don't get through, we can get a peek.`,
  //   85,
  //   'ITEM',
  //   'CURR_MIN',
  //   6003,
  //   2000
  // );
  // await api.goal.add.reward.display(7, 'Door Unlock');
  // await api.goal.add.reward.basic(7, 'Bronze', 7, 'LOYALTY', 1, 3);
  // await api.goal.add.reward.basic(7, 'Bronze', 7, 'ITEM', 21003, 10);
  // // TODO: Cleaning Fluid (item not found in items.csv)
  // await api.goal.add.reward.basic(7, 'Silver', 23, 'LOYALTY', 1, 3);
  // await api.goal.add.reward.basic(7, 'Silver', 23, 'ITEM', 21003, 20);
  // await api.goal.add.reward.basic(7, 'Silver', 23, 'ITEM', 21004, 15);
  // await api.goal.add.reward.basic(7, 'Gold', 42, 'LOYALTY', 1, 3);
  // await api.goal.add.reward.basic(7, 'Gold', 42, 'ITEM', 21003, 30);
  // await api.goal.add.reward.basic(7, 'Gold', 42, 'ITEM', 21004, 25);
  // await api.goal.enable(7);

  await api.goal.create(
    8,
    'Secret Teachings of the Ages',
    `Whatever lies behind this door must be really important. There are layers of energy fields blocking us off. Some of these I can't even recognize…
      Mina says it needs to recognize its people and remember its history. If the door feels like it's the right time and place, it'll open. Providing that sensation is going to be pretty hard, but you can do it!`,
    74,
    'ITEM',
    'CURR_MIN',
    6007,
    500
  );
  await api.goal.add.reward.display(8, 'Door Unlock');
  await api.goal.add.reward.basic(8, 'Bronze', 2, 'LOYALTY', 1, 3);
  await api.goal.add.reward.basic(8, 'Bronze', 2, 'ITEM', 21004, 22);
  await api.goal.add.reward.basic(8, 'Bronze', 2, 'ITEM', 11411, 2);
  await api.goal.add.reward.basic(8, 'Silver', 6, 'LOYALTY', 1, 3);
  await api.goal.add.reward.basic(8, 'Silver', 6, 'ITEM', 21003, 66);
  await api.goal.add.reward.basic(8, 'Silver', 6, 'ITEM', 11501, 33);
  await api.goal.add.reward.basic(8, 'Gold', 11, 'LOYALTY', 1, 3);
  await api.goal.add.reward.basic(8, 'Gold', 11, 'ITEM', 21005, 1);
  await api.goal.enable(8);

  await api.goal.create(
    9,
    'Just a Little Snack',
    `I thought that little creature on the pedestal was stuffed, but I can hear him whispering to us. Can you make it out?
      It's saying that it's hungry and hasn't eaten in a long time. Why not eat the apples here? It says it doesn't like them.
      The little thing is kind of cute. Maybe we could share something?`,
    89,
    'ITEM',
    'CURR_MIN',
    11302,
    5000
  );
  await api.goal.add.reward.display(9, 'Questline unlocked globally');
  await api.goal.add.reward.basic(9, 'Bronze', 18, 'ITEM', 1012, 3);
  await api.goal.add.reward.basic(9, 'Silver', 60, 'ITEM', 1010, 7);
  await api.goal.add.reward.basic(9, 'Gold', 100, 'ITEM', 1007, 12);
  await api.goal.enable(9);
}

export async function deleteGoals(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.remove.full(indices[i]);
  }
}

export async function deleteGoalRewards(api: AdminAPI, indices: number[]) {
  for (let i = 0; i < indices.length; i++) {
    await api.goal.remove.rewards(indices[i]);
  }
}
