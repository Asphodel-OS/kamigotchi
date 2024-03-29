import { utils } from 'ethers';

import droptablesCSV from 'assets/data/items/droptables2.csv';
import itemsCSV from 'assets/data/items/items2.csv';
import nodesCSV from 'assets/data/nodes/nodes2.csv';
import roomsCSV from 'assets/data/rooms/rooms2.csv';
import backgroundCSV from 'assets/data/traits/backgrounds2.csv';
import bodyCSV from 'assets/data/traits/bodies2.csv';
import colorCSV from 'assets/data/traits/colors2.csv';
import faceCSV from 'assets/data/traits/faces2.csv';
import handCSV from 'assets/data/traits/hands2.csv';

import { createAdminAPI } from './admin';
import { createPlayerAPI } from './player';

export type WorldAPI = ReturnType<typeof setupWorldAPI>;

export function setupWorldAPI(systems: any, provider: any) {
  const api = createAdminAPI(systems);

  async function initAll() {
    setAutoMine(true);

    await initConfig();
    await initRooms();
    await initNodes();
    await initItems();
    await initNpcs();
    await initQuests();
    await initSkills();
    await initTraits();
    await initRelationships();

    if (!import.meta.env.MODE || import.meta.env.MODE == 'development') {
      await initLocalConfig();
      await initGachaPool(333);
    } else {
      await initGachaPool(3333);
    }

    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer',
      'fudge'
    );

    setTimestamp();
    setAutoMine(false);
  }

  ///////////////////
  // CONFIG

  async function initConfig() {
    await api.config.set.string('BASE_URI', 'https://image.asphodel.io/kami/');

    // Leaderboards
    await api.config.set.number('LEADERBOARD_EPOCH', 1);

    // Account Stamina
    await api.config.set.number('ACCOUNT_STAMINA_BASE', 20);
    await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

    // Friends
    await api.config.set.number('FRIENDS_BASE_LIMIT', 10);
    await api.config.set.number('FRIENDS_REQUEST_LIMIT', 10);

    // Kami Idle Requirement
    await api.config.set.number('KAMI_IDLE_REQ', 180);

    // Kami Mint Price and Limits
    // to be 5, set at 500 for testing
    await api.config.set.number('MINT_ACCOUNT_MAX', 5);
    await api.config.set.number('MINT_INITIAL_MAX', 1111);
    await api.config.set.number('MINT_TOTAL_MAX', 4444);
    await api.config.set.number('MINT_PRICE', utils.parseEther('0.0'));
    await api.config.set.wei('GACHA_REROLL_PRICE', utils.parseEther('0.0001'));

    // Kami Base Stats
    await api.config.set.number('KAMI_BASE_HEALTH', 50);
    await api.config.set.number('KAMI_BASE_POWER', 10);
    await api.config.set.number('KAMI_BASE_VIOLENCE', 10);
    await api.config.set.number('KAMI_BASE_HARMONY', 10);
    await api.config.set.number('KAMI_BASE_SLOTS', 0);

    // Kami Leveling Curve
    await api.config.set.number('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
    await api.config.set.number('KAMI_LVL_REQ_MULT_BASE', 1259); // compounding increase per level
    await api.config.set.number('KAMI_LVL_REQ_MULT_BASE_PREC', 3); // precision of compounding increase

    // Harvest Rates
    // HarvestRate = power * base * multiplier
    // NOTE: precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
    await api.config.set.number('HARVEST_RATE_PREC', 9); // ignore this
    await api.config.set.number('HARVEST_RATE_BASE', 250); // in respect to power
    await api.config.set.number('HARVEST_RATE_BASE_PREC', 2); // i.e. x/100
    await api.config.set.number('HARVEST_RATE_MULT_PREC', 7); // 2 affinities and 1 bonus multiplier with precision of 2
    await api.config.set.number('HARVEST_RATE_MULT_AFF_BASE', 100);
    await api.config.set.number('HARVEST_RATE_MULT_AFF_UP', 150);
    await api.config.set.number('HARVEST_RATE_MULT_AFF_DOWN', 50);
    await api.config.set.number('HARVEST_RATE_MULT_AFF_PREC', 2); // 2, not actually used

    // Kami Health Drain/Heal Rates
    // DrainRate = HarvestRate * DrainBaseRate
    // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HealBaseRate
    // HealBaseRate = HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    await api.config.set.number('HEALTH_RATE_DRAIN_BASE', 20); // in respect to harvest rate
    await api.config.set.number('HEALTH_RATE_DRAIN_BASE_PREC', 2); // i.e. x/100
    await api.config.set.number('HEALTH_RATE_HEAL_PREC', 9); // ignore this, for consistent math on SC
    await api.config.set.number('HEALTH_RATE_HEAL_BASE', 120); // in respect to harmony
    await api.config.set.number('HEALTH_RATE_HEAL_BASE_PREC', 2); // i.e. x/100

    // Liquidation Calcs
    await api.config.set.number('LIQ_THRESH_BASE', 40);
    await api.config.set.number('LIQ_THRESH_BASE_PREC', 2);
    await api.config.set.number('LIQ_THRESH_MULT_AFF_BASE', 100);
    await api.config.set.number('LIQ_THRESH_MULT_AFF_UP', 200);
    await api.config.set.number('LIQ_THRESH_MULT_AFF_DOWN', 50);
    await api.config.set.number('LIQ_THRESH_MULT_AFF_PREC', 2);

    // Liquidation Bounty
    await api.config.set.number('LIQ_BOUNTY_BASE', 50);
    await api.config.set.number('LIQ_BOUNTY_BASE_PREC', 2);
  }

  // local config settings for faster testing
  async function initLocalConfig() {
    await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 10);
    await api.config.set.number('KAMI_IDLE_REQ', 10);
    await api.config.set.number('KAMI_LVL_REQ_BASE', 5); // experience required for level 1->2
    await api.config.set.number('HARVEST_RATE_BASE', 10000); // in respect to power
    await api.config.set.number('HEALTH_RATE_HEAL_BASE', 10000); // in respect to harmony
  }

  ////////////////////
  // ROOMS

  async function initRooms() {
    for (let i = 0; i < roomsCSV.length; i++) {
      await sleepIf();
      console.log(roomsCSV[i]);
      if (roomsCSV[i]['Enabled'] === 'Yes') {
        await api.room.create(
          {
            x: Number(roomsCSV[i]['X']),
            y: Number(roomsCSV[i]['Y']),
            z: Number(roomsCSV[i]['Z']),
          },
          Number(roomsCSV[i]['Index']),
          roomsCSV[i]['Name'],
          roomsCSV[i]['Description'],
          roomsCSV[i]['Exits'].split(',').map((n: string) => Number(n.trim()))
        );
      }
    }

    // load bearing test to initialse IndexSourceComponent - queries wont work without
    try {
      api.room.createGate(1, 1, 0, 0, 'CURR_MIN', 'KAMI');
    } catch (e) {
      console.log('gate creation failure:', e);
    }
  }

  async function deleteRooms(indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.room.delete(indices[i]);
      } catch {
        console.error('Could not delete room at roomIndex ' + indices[i]);
      }
    }
  }

  ////////////////////
  // ITEMS

  async function initItems() {
    console.log(roomsCSV);
    console.log(itemsCSV);
    for (let i = 0; i < itemsCSV.length; i++) {
      await sleepIf();
      const item = itemsCSV[i];
      const type = item['Type'].toUpperCase();
      console.log(itemsCSV[i]);
      try {
        if (type === 'FOOD') await setFood(item);
        else if (type === 'REVIVE') await setRevive(item);
        else if (type === 'MISC') await setMisc(item);
        else if (type === 'LOOTBOX') await setLootbox(item, droptablesCSV);
        else console.error('Item type not found: ' + type);
      } catch {}
    }
  }

  async function deleteItems(indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.registry.item.delete(indices[i]);
      } catch {
        console.error('Could not delete item ' + indices[i]);
      }
    }
  }

  async function setFood(item: any) {
    await api.registry.item.create.food(
      Number(item['Index']),
      item['Name'],
      item['Description'],
      Number(item['Health'] ?? 0),
      Number(item['XP'] ?? 0),
      item['MediaURI']
    );
  }

  async function setRevive(item: any) {
    await api.registry.item.create.revive(
      Number(item['Index']),
      item['Name'],
      item['Description'],
      Number(item['Health'] ?? 0),
      item['MediaURI']
    );
  }

  async function setMisc(item: any) {
    await api.registry.item.create.consumable(
      Number(item['Index']),
      item['Name'],
      item['Description'],
      item['miscCategory'],
      item['MediaURI']
    );
  }

  async function setLootbox(item: any, droptables: any) {
    return; // skip lootboxes for now. similar challenges in representation to rooms
    await api.registry.item.create.lootbox(
      Number(item['Index']),
      item['Name'],
      item['Description'],
      droptables[Number(item['Droptable']) - 1]['Key'],
      droptables[Number(item['Droptable']) - 1]['Tier'],
      item['MediaURI']
    );
  }

  ////////////////////
  // NPCS

  async function initNpcs() {
    await initMerchants();
  }

  async function initMerchants() {
    // create our hottie merchant ugajin. names are unique
    await api.npc.create(1, 'Mina', 13);

    await api.listing.set(1, 1, 50, 0); // merchant index, item index, buy price, sell price
    await api.listing.set(1, 2, 180, 0);
    await api.listing.set(1, 3, 320, 0);
    await api.listing.set(1, 1001, 500, 0);
  }

  ////////////////////
  // NODES

  async function initNodes() {
    for (let i = 0; i < nodesCSV.length; i++) {
      const node = nodesCSV[i];
      await sleepIf();
      try {
        await api.node.create(
          Number(node['Index']),
          node['Type'],
          Number(node['RoomIndex']),
          node['Name'],
          node['Description'],
          node['Affinity']
        );
      } catch {}
    }
  }

  async function deleteNodes(indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.node.delete(indices[i]);
      } catch {
        console.error('Could not delete node ' + indices[i]);
      }
    }
  }

  ///////////////////
  // MINT FLOW

  async function initGachaPool(numToMint: number) {
    await api.mint.gacha.init();
    await api.mint.batchMinter.init();

    const batchSize = 8;
    const numLoops = Math.floor(numToMint / batchSize);
    for (let i = 0; i < numLoops; i++) {
      await sleepIf();
      await api.mint.batchMinter.mint(batchSize);
    }
    await api.mint.batchMinter.mint(numToMint % batchSize);
  }

  ////////////////////
  // QUESTS

  async function initQuests() {
    // create quests

    // quest 1
    await api.registry.quest.create(
      1,
      'Welcome',
      "Welcome to Kamigotchi World.\n\nYou can move by opening the map menu - try the buttons on the top right. If you can work out how to move to room 4, we'll give you something special.",
      1,
      0
    );
    await api.registry.quest.add.objective(1, 'Find the vending machine', 'BOOL_IS', 'ROOM', 4, 0);
    await api.registry.quest.add.reward(1, 'MINT20', 0, 5);
    await api.registry.quest.add.reward(1, 'QUEST_POINTS', 0, 1);

    // quest 2
    await api.registry.quest.create(
      2,
      'Mint',
      "Well done.\n\nNow you've worked out how to move.But you won't be able to do much here unless you're able to get yourself a Kamigotchi.\n\nFind the vending machine.",
      2,
      0
    );
    await api.registry.quest.add.requirement(2, 'COMPLETE', 'QUEST', 1, 0);
    await api.registry.quest.add.objective(2, 'Mint a Kami', 'CURR_MIN', 'KAMI', 0, 1);
    await api.registry.quest.add.reward(2, 'ITEM', 2, 1);
    await api.registry.quest.add.reward(2, 'QUEST_POINTS', 0, 2);

    // quest 3
    await api.registry.quest.create(
      3,
      'Harvest',
      'With your Kamigotchi, your existence now has meaning.\n\nSeek out a Node if you also wish for your existence to have MUSU.',
      4,
      0
    );
    await api.registry.quest.add.requirement(3, 'COMPLETE', 'QUEST', 2, 0);
    await api.registry.quest.add.objective(3, 'Harvest from a Node', 'INC_MIN', 'COIN_TOTAL', 0, 1);
    await api.registry.quest.add.reward(3, 'ITEM', 1001, 1);
    await api.registry.quest.add.reward(3, 'QUEST_POINTS', 0, 2);

    // quest 4
    await api.registry.quest.create(
      4,
      'Farming 1: A Pocketful of $MUSU',
      "You've gotten a taste for harvesting now. Did you know you can leave your Kamigotchi to harvest while you explore? Just remember to come back in time....",
      0,
      0
    );
    await api.registry.quest.add.requirement(4, 'COMPLETE', 'QUEST', 3, 0);
    await api.registry.quest.add.objective(4, 'Harvest 100 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 100);
    await api.registry.quest.add.reward(4, 'ITEM', 1001, 3);
    await api.registry.quest.add.reward(4, 'QUEST_POINTS', 0, 3);

    // quest 5
    await api.registry.quest.create(
      5,
      'Farming 2: Stacking $MUSU',
      "You're getting the hang of it. \n\nYour Kamigotchi will passively restore HP over time, but you can feed them if you want to get back to harvesting sooner…",
      0,
      0
    );
    await api.registry.quest.add.requirement(5, 'COMPLETE', 'QUEST', 4, 0);
    await api.registry.quest.add.objective(
      5,
      'Harvest 1000 $MUSU',
      'INC_MIN',
      'COIN_TOTAL',
      0,
      1000
    );
    await api.registry.quest.add.reward(5, 'ITEM', 1001, 5);
    await api.registry.quest.add.reward(5, 'QUEST_POINTS', 0, 4);

    // quest 6
    await api.registry.quest.create(
      6,
      'Farming 3: Accumulating $MUSU',
      "Great, you're really taking this seriously. This one's a long haul. \n\nHope you're getting into a healthy routine with your Kamigotchi now. \n\nIf you haven't already noticed, there's plenty of secrets hidden around the world.",
      0,
      0
    );
    await api.registry.quest.add.requirement(6, 'COMPLETE', 'QUEST', 5, 0);
    await api.registry.quest.add.objective(
      6,
      'Harvest 5000 $MUSU',
      'INC_MIN',
      'COIN_TOTAL',
      0,
      5000
    );
    await api.registry.quest.add.reward(6, 'ITEM', 1001, 10);
    await api.registry.quest.add.reward(6, 'QUEST_POINTS', 0, 8);

    // quest 7
    await api.registry.quest.create(7, 'Daily quest: Harvesting', 'Harvest 200 $MUSU', 0, 64800);
    await api.registry.quest.add.objective(7, 'Harvest 200 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 200);
    await api.registry.quest.add.reward(7, 'ITEM', 10001, 1);

    // quest 8 and 9 have previously been repeatable quests for testing
    // can't use for new non-repeatable quests for backwards compatibility

    await api.registry.quest.create(
      10,
      "Liquidation 1: An Unforgiving World/You're Not Alone ",
      "Your Kamigotchi has had enough of farming for now. Why don't you take it exploring? Remember to stock up on supplies and watch out. This is a Kami-eat-Kami world.\
      \n\nIf Kamigotchi are reduced to 0 Health on a Node and get tired, the other Kamigotchi may see them as just another resource to be claimed.\
      \n\nTry it out.If you have a Kamigotchi with a Violent nature, let it indulge.Liquidating exhausted Kami is another way to gain $MUSU.",
      0,
      0
    );
    await api.registry.quest.add.requirement(10, 'COMPLETE', 'QUEST', 3, 0);
    await api.registry.quest.add.objective(10, 'Liquidate 1 Kami', 'INC_MIN', 'LIQUIDATE', 0, 1);
    await api.registry.quest.add.reward(10, 'ITEM', 5, 1);

    await api.registry.quest.create(
      11,
      'Liquidation 3: Getting used to it/Harden Your Heart',
      'Liquidate ten more Kamigotchi and take their $MUSU. Kami lacking in spiritual Harmony will be your easiest targets.',
      0,
      0
    );
    await api.registry.quest.add.requirement(11, 'COMPLETE', 'QUEST', 10, 0);
    await api.registry.quest.add.objective(11, 'Liquidate 10 Kamis', 'INC_MIN', 'LIQUIDATE', 0, 10);
    await api.registry.quest.add.reward(11, 'ITEM', 4, 1);
  }

  async function deleteQuests(indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.registry.quest.delete(indices[i]);
      } catch {
        console.error('Could not delete quest ' + indices[i]);
      }
    }
  }

  ////////////////////
  // RELATIONSHIPS

  async function initRelationships() {
    //        /->8->9-\
    // 1->2->3->4->5--->10
    //        \->6->7-/
    // top and bottom paths are mutually exclusive
    await api.registry.relationship.create(1, 1, 'mina 1', [], []);
    await api.registry.relationship.create(1, 2, 'mina 2', [1], []);
    await api.registry.relationship.create(1, 3, 'mina 3', [2], []);
    await api.registry.relationship.create(1, 4, 'mina 4', [3], []);
    await api.registry.relationship.create(1, 5, 'mina 5', [4], []);
    await api.registry.relationship.create(1, 6, 'mina 6', [3], [8]);
    await api.registry.relationship.create(1, 7, 'mina 7', [6], [8]);
    await api.registry.relationship.create(1, 8, 'mina 8', [3], [6]);
    await api.registry.relationship.create(1, 9, 'mina 9', [8], [6]);
    await api.registry.relationship.create(1, 10, 'mina 10', [5, 7, 9], []);
  }

  async function deleteRelationships(npcs: number[], indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.registry.relationship.delete(npcs[i], indices[i]);
      } catch {
        console.error('Could not delete relationship ' + indices[i] + ' for npc ' + npcs[i]);
      }
    }
  }

  ////////////////////
  // SKILL

  async function initSkills() {
    // Stat Skills
    await api.registry.skill.create(
      1,
      'KAMI',
      'PASSIVE',
      'Vigor',
      1,
      3,
      '+10 Health per level',
      'images/skills/vigor.png'
    );
    await api.registry.skill.add.effect(1, 'STAT', 'HEALTH', 'INC', 0, 10);

    await api.registry.skill.create(
      2,
      'KAMI',
      'PASSIVE',
      'Acquisitiveness',
      1,
      3,
      '+1 Power per level',
      'images/skills/acquisitiveness.png'
    );
    await api.registry.skill.add.effect(2, 'STAT', 'POWER', 'INC', 0, 1);

    await api.registry.skill.create(
      3,
      'KAMI',
      'PASSIVE',
      'Aggression',
      1,
      3,
      '+1 Violence per level',
      'images/skills/aggression.png'
    );
    await api.registry.skill.add.effect(3, 'STAT', 'VIOLENCE', 'INC', 0, 1);

    await api.registry.skill.create(
      4,
      'KAMI',
      'PASSIVE',
      'Defensiveness',
      1,
      3,
      '+1 Harmony per level',
      'images/skills/defensiveness.png'
    );
    await api.registry.skill.add.effect(4, 'STAT', 'HARMONY', 'INC', 0, 1);

    await api.registry.skill.create(
      5,
      'KAMI',
      'PASSIVE',
      'Endurance',
      2,
      3,
      '+10 Health per level',
      'images/skills/endurance.png'
    );
    await api.registry.skill.add.effect(5, 'STAT', 'HEALTH', 'INC', 0, 10);
    await api.registry.skill.add.requirement(5, 'SKILL', 1, 3);

    await api.registry.skill.create(
      6,
      'KAMI',
      'PASSIVE',
      'Predator',
      2,
      3,
      '+1 Power per level',
      'images/skills/predator.png'
    );
    await api.registry.skill.add.effect(6, 'STAT', 'POWER', 'INC', 0, 1);
    await api.registry.skill.add.requirement(6, 'SKILL', 2, 3);

    await api.registry.skill.create(
      7,
      'KAMI',
      'PASSIVE',
      'Warmonger',
      2,
      3,
      '+1 Violence per level',
      'images/skills/warmonger.png'
    );
    await api.registry.skill.add.effect(7, 'STAT', 'VIOLENCE', 'INC', 0, 1);
    await api.registry.skill.add.requirement(7, 'SKILL', 3, 3);

    await api.registry.skill.create(
      8,
      'KAMI',
      'PASSIVE',
      'Protector',
      2,
      3,
      '+1 Harmony per level',
      'images/skills/protector.png'
    );
    await api.registry.skill.add.effect(8, 'STAT', 'HARMONY', 'INC', 0, 1);
    await api.registry.skill.add.requirement(8, 'SKILL', 4, 3);

    // (Health) Skill Tree
    await api.registry.skill.create(
      110,
      'KAMI',
      'PASSIVE',
      'Workout Routine',
      1,
      3,
      '-5% Harvest Drain per level',
      'images/skills/workout-routine.png'
    );
    await api.registry.skill.add.effect(110, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
    await api.registry.skill.add.requirement(110, 'SKILL', 1, 3);

    // (Power) Skill Tree
    await api.registry.skill.create(
      201,
      'KAMI',
      'PASSIVE',
      'Greed',
      1,
      3,
      '+5% Harvest Output per level',
      'images/skills/greed.png'
    );
    await api.registry.skill.add.effect(201, 'HARVEST', 'OUTPUT', 'INC', 0, 50);
    await api.registry.skill.add.requirement(201, 'SKILL', 2, 3);

    await api.registry.skill.create(
      202,
      'KAMI',
      'PASSIVE',
      'Leverage',
      2,
      3,
      '+7.5% Harvest Output per level',
      'images/skills/leverage.png'
    );
    await api.registry.skill.add.effect(202, 'HARVEST', 'OUTPUT', 'INC', 0, 75);
    await api.registry.skill.add.requirement(202, 'SKILL', 201, 3);

    await api.registry.skill.create(
      203,
      'KAMI',
      'PASSIVE',
      'Looping',
      3,
      3,
      '+10% Harvest Output per level',
      'images/skills/looping.png'
    );
    await api.registry.skill.add.effect(203, 'HARVEST', 'OUTPUT', 'INC', 0, 100);
    await api.registry.skill.add.requirement(203, 'SKILL', 202, 3);

    await api.registry.skill.create(
      204,
      'KAMI',
      'PASSIVE',
      'Degenerate',
      3,
      3,
      '+12.5% Harvest Output per level',
      'images/skills/degenerate.png'
    );
    await api.registry.skill.add.effect(204, 'HARVEST', 'OUTPUT', 'INC', 0, 125);
    await api.registry.skill.add.requirement(204, 'SKILL', 203, 3);

    await api.registry.skill.create(
      210,
      'KAMI',
      'PASSIVE',
      'Sunglasses Ownership',
      1,
      3,
      '-5% Harvest Drain per level',
      'images/skills/sunglasses-ownership.png'
    );
    await api.registry.skill.add.effect(210, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
    await api.registry.skill.add.requirement(210, 'SKILL', 2, 3);

    await api.registry.skill.create(
      220,
      'KAMI',
      'PASSIVE',
      'Bandit',
      1,
      3,
      '-20s Harvest Cooldown per level',
      'images/skills/bandit.png'
    );
    await api.registry.skill.add.effect(220, 'HARVEST', 'COOLDOWN', 'INC', 0, 20);
    await api.registry.skill.add.requirement(220, 'SKILL', 2, 3);

    // (Violence) Skill Tree
    await api.registry.skill.create(
      320,
      'KAMI',
      'PASSIVE',
      'Sniper',
      1,
      3,
      '-20s Attack Cooldown per level',
      'images/skills/sniper.png'
    );
    await api.registry.skill.add.effect(320, 'ATTACK', 'COOLDOWN', 'INC', 0, 20);
    await api.registry.skill.add.requirement(320, 'SKILL', 3, 3);

    // (Harmony) Skill Tree
    await api.registry.skill.create(
      401,
      'KAMI',
      'PASSIVE',
      'Patience',
      1,
      3,
      '-5% Harvest Drain per level',
      'images/skills/patience.png'
    );
    await api.registry.skill.add.effect(401, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
    await api.registry.skill.add.requirement(401, 'SKILL', 4, 3);
  }

  async function deleteSkills(indices: number[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.registry.skill.delete(indices[i]);
      } catch {
        console.error('Could not delete skill ' + indices[i]);
      }
    }
  }

  ////////////////////
  // TRAITS

  async function initTraits() {
    await initTraitTable(backgroundCSV, 'BACKGROUND');
    await initTraitTable(bodyCSV, 'BODY');
    await initTraitTable(colorCSV, 'COLOR');
    await initTraitTable(faceCSV, 'FACE');
    await initTraitTable(handCSV, 'HAND');
  }

  // inits a single type of trait, returns number of traits
  async function initTraitTable(table: any, type: string) {
    for (let i = 0; i < table.length; i++) {
      const trait = table[i];
      await sleepIf();
      try {
        api.registry.trait.create(
          Number(trait['Index']), // individual trait index
          Number(trait['Health'] ?? 0),
          Number(trait['Power'] ?? 0),
          Number(trait['Violence'] ?? 0),
          Number(trait['Harmony'] ?? 0),
          Number(trait['Slots'] ?? 0),
          Number(trait['Tier'] ?? 0),
          (trait['Affinity'] ?? '').toUpperCase(),
          trait['Name'], // name of trait
          type // type: body, color, etc
        );
      } catch (e) {
        console.error('Failed to create trait ', trait, e);
      }
    }

    return table.length;
  }

  async function deleteTraits(indices: number[], types: string[]) {
    for (let i = 0; i < indices.length; i++) {
      await sleepIf();
      try {
        await api.registry.trait.delete(indices[i], types[i]);
      } catch {
        console.error('Could not delete trait ' + indices[i]);
      }
    }
  }

  return {
    init: initAll,
    config: {
      init: () => initConfig(),
    },
    items: {
      init: () => initItems(),
      delete: (indices: number[]) => deleteItems(indices),
    },
    npcs: {
      init: () => initNpcs(),
    },
    nodes: {
      init: () => initNodes(),
      delete: (indices: number[]) => deleteNodes(indices),
    },
    mint: {
      init: (n: number) => initGachaPool(n),
    },
    quests: {
      init: () => initQuests(),
      delete: (indices: number[]) => deleteQuests(indices),
    },
    relationships: {
      init: () => initRelationships(),
      delete: (npcs: number[], indices: number[]) => deleteRelationships(indices, npcs),
    },
    rooms: {
      init: () => initRooms(),
      delete: (indices: number[]) => deleteRooms(indices),
    },
    skill: {
      init: () => initSkills(),
      delete: (indices: number[]) => deleteSkills(indices),
    },
    traits: {
      init: () => initTraits(),
      delete: (indices: number[], types: string[]) => deleteTraits(indices, types),
    },
  };

  function sleepIf() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || import.meta.env.MODE;
    if (mode && (mode == 'staging' || mode == 'production')) {
      console.log('sleeping');
      return new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }

  // temporary function to enable switch anvil modes for sending many transactions at one go
  // will not be needed when world.ts migrates to solidity
  function setAutoMine(on: boolean) {
    if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
      provider.send(`${on ? 'evm_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
    }
  }

  function setTimestamp() {
    if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
      const timestamp = Math.floor(new Date().getTime() / 1000);
      provider.send('evm_setNextBlockTimestamp', [timestamp]);
    }
  }
}
