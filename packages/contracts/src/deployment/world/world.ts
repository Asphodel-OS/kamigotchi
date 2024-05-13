import { parse } from 'csv-parse/sync';
import { utils } from 'ethers';
import { createStateAPI, StateAPI } from './StateAPI';

/// @note not currently in use, but archived in the codebase to potentially be useful someday
/**
 * This is adapted off world.ts from the client package.
 *
 * Not implemented
 */

export async function run() {
  const droptablesFile = readFile('items/Droptables.csv');
  const itemsFile = readFile('items/Items.csv');
  const backgroundFile = readFile('kami/Background.csv');
  const bodyFile = readFile('kami/Body.csv');
  const colorFile = readFile('kami/Color.csv');
  const faceFile = readFile('kami/Face.csv');
  const handFile = readFile('kami/Hand.csv');
  const nodesFile = readFile('nodes/Nodes.csv');
  const roomsFile = readFile('rooms/Rooms.csv');
  const mapsFile = readFile('rooms/Maps.csv');

  const droptables = await parse(droptablesFile);
  const items = await parse(itemsFile);
  const background = await parse(backgroundFile);
  const body = await parse(bodyFile);
  const color = await parse(colorFile);
  const face = await parse(faceFile);
  const hand = await parse(handFile);
  const nodes = await parse(nodesFile);
  const rooms = await parse(roomsFile);
  const maps = await parse(mapsFile);

  const compiledCalls: string[] = [];
  const state = createStateAPI(compiledCalls);
  setUpWorld(state).init();
  console.log(compiledCalls.length);
  writeOutput(compiledCalls);

  function setUpWorld(api: StateAPI) {
    function initAll() {
      initConfig(api);
      initRooms(api);
      initNodes(api);
      initItems(api);
      initNpcs(api);
      initQuests(api);
      initSkills(api);
      initTraits(api);
      initRelationships(api);

      if (!process.env.MODE || process.env.MODE == 'DEV') {
        initLocalConfig(api);
        initGachaPool(api, 333);
      } else {
        initGachaPool(api, 3333);
      }

      api.account.create('0x000000000000000000000000000000000000dEaD', 'load_bearer', 'fudge');
    }

    ///////////////////
    // CONFIG

    function initConfig(api: StateAPI) {
      api.config.set.string('BASE_URI', 'https://image.asphodel.io/kami/');

      // Leaderboards
      api.config.set.number('LEADERBOARD_EPOCH', 1);

      // Account Stamina
      api.config.set.number('ACCOUNT_STAMINA_BASE', 20);
      api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

      // Friends
      api.config.set.number('FRIENDS_BASE_LIMIT', 10);
      api.config.set.number('FRIENDS_REQUEST_LIMIT', 10);

      // Kami Idle Requirement
      api.config.set.number('KAMI_STANDARD_COOLDOWN', 180);

      // Kami Mint Price and Limits
      // to be 5, set at 500 for testing
      api.config.set.number('MINT_ACCOUNT_MAX', 5);
      api.config.set.number('MINT_INITIAL_MAX', 1111);
      api.config.set.number('MINT_TOTAL_MAX', 4444);
      api.config.set.number('MINT_PRICE', utils.parseEther('0.0'));
      api.config.set.wei('GACHA_REROLL_PRICE', utils.parseEther('0.0001'));

      // Kami Base Stats
      api.config.set.number('KAMI_BASE_HEALTH', 50);
      api.config.set.number('KAMI_BASE_POWER', 10);
      api.config.set.number('KAMI_BASE_VIOLENCE', 10);
      api.config.set.number('KAMI_BASE_HARMONY', 10);
      api.config.set.number('KAMI_BASE_SLOTS', 0);

      // Kami Leveling Curve
      api.config.set.number('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
      api.config.set.number('KAMI_LVL_REQ_MULT_BASE', 1259); // compounding increase per level
      api.config.set.number('KAMI_LVL_REQ_MULT_BASE_PREC', 3); // precision of compounding increase

      // Harvest Rates
      // HarvestRate = power * base * multiplier
      // NOTE: precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
      // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
      api.config.set.number('HARVEST_RATE_PREC', 9); // ignore this
      api.config.set.number('HARVEST_RATE_BASE', 250); // in respect to power
      api.config.set.number('HARVEST_RATE_BASE_PREC', 2); // i.e. x/100
      api.config.set.number('HARVEST_RATE_MULT_PREC', 7); // 2 affinities and 1 bonus multiplier with precision of 2
      api.config.set.number('KAMI_HARV_EFFICACY_BASE', 100);
      api.config.set.number('KAMI_HARV_EFFICACY_UP', 150);
      api.config.set.number('KAMI_HARV_EFFICACY_DOWN', 50);
      api.config.set.number('KAMI_HARV_EFFICACY_PREC', 2); // 2, not actually used

      // Kami Health Drain/Heal Rates
      // DrainRate = HarvestRate * DrainBaseRate
      // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
      // HealRate = Harmony * HealBaseRate
      // HealBaseRate = KAMI_REST_METABOLISM / 10^KAMI_REST_METABOLISM_PREC
      api.config.set.number('HEALTH_RATE_DRAIN_BASE', 20); // in respect to harvest rate
      api.config.set.number('HEALTH_RATE_DRAIN_BASE_PREC', 2); // i.e. x/100
      api.config.set.number('HEALTH_RATE_HEAL_PREC', 9); // ignore this, for consistent math on SC
      api.config.set.number('KAMI_REST_METABOLISM', 120); // in respect to harmony
      api.config.set.number('KAMI_REST_METABOLISM_PREC', 2); // i.e. x/100

      // Liquidation Calcs
      api.config.set.number('LIQ_THRESH_BASE', 40);
      api.config.set.number('LIQ_THRESH_BASE_PREC', 2);
      api.config.set.number('LIQ_THRESH_MULT_AFF_BASE', 100);
      api.config.set.number('LIQ_THRESH_MULT_AFF_UP', 200);
      api.config.set.number('LIQ_THRESH_MULT_AFF_DOWN', 50);
      api.config.set.number('LIQ_THRESH_MULT_AFF_PREC', 2);

      // Liquidation Bounty
      api.config.set.number('LIQ_BOUNTY_BASE', 50);
      api.config.set.number('LIQ_BOUNTY_BASE_PREC', 2);
    }

    // local config settings for faster testing
    function initLocalConfig(api: StateAPI) {
      api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 10);
      api.config.set.number('KAMI_STANDARD_COOLDOWN', 10);
      api.config.set.number('KAMI_LVL_REQ_BASE', 5); // experience required for level 1->2
      api.config.set.number('HARVEST_RATE_BASE', 10000); // in respect to power
      api.config.set.number('KAMI_REST_METABOLISM', 10000); // in respect to harmony
    }

    ////////////////////
    // ROOMS

    function initRooms(api: StateAPI) {
      const allRooms = csvToMap(rooms);
      const map = csvToCoords(maps);
      for (let i = 0; i < allRooms.length; i++) {
        try {
          if (allRooms[i].get('Enabled') === 'Yes') {
            api.room.create(
              map.get(allRooms[i].get('Name').trim()),
              Number(allRooms[i].get('Index')),
              allRooms[i].get('Name'),
              allRooms[i].get('Description'),
              allRooms[i]
                .get('Exits')
                .split(',')
                .map((n: string) => n.trim())
            );
          }
        } catch {
          console.log('Could not create room at index ' + allRooms[i].get('Index'));
        }
      }
      try {
        // load bearing test to initialse IndexSourceComponent - queries wont work without
        api.room.createGate(1, 1, 0, 0, 'CURR_MIN', 'KAMI');
      } catch {}
    }

    function deleteRooms(api: StateAPI, roomIndexs: number[]) {
      for (let i = 0; i < roomIndexs.length; i++) {
        try {
          api.room.delete(roomIndexs[i]);
        } catch {
          console.error('Could not delete room at roomIndex ' + roomIndexs[i]);
        }
      }
    }

    ////////////////////
    // ITEMS

    function initItems(api: StateAPI) {
      const allItems = csvToMap(items);
      const allDroptables = csvLayeredToMap(droptables);

      for (let i = 0; i < allItems.length; i++) {
        try {
          switch (allItems[i].get('Type').toUpperCase()) {
            case 'FOOD':
              setFood(api, allItems[i]);
              break;
            case 'REVIVE':
              setRevive(api, allItems[i]);
              break;
            case 'MISC':
              setMisc(api, allItems[i]);
              break;
            case 'LOOTBOX':
              setLootbox(api, allItems[i], allDroptables);
              break;
            default:
              console.error('Item type not found: ' + allItems[i].get('Type'));
          }
        } catch {}
      }
    }

    function deleteItems(api: StateAPI, indices: number[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.registry.item.delete(indices[i]);
        } catch {
          console.error('Could not delete item ' + indices[i]);
        }
      }
    }

    function setFood(api: StateAPI, item: any) {
      api.registry.item.create.food(
        item.get('Index'),
        item.get('Name'),
        item.get('Description'),
        item.get('Health'),
        item.get('XP'),
        item.get('MediaURI')
      );
    }

    function setRevive(api: StateAPI, item: any) {
      api.registry.item.create.revive(
        item.get('Index'),
        item.get('Name'),
        item.get('Description'),
        item.get('Health'),
        item.get('MediaURI')
      );
    }

    function setMisc(api: StateAPI, item: any) {
      api.registry.item.create.consumable(
        item.get('Index'),
        item.get('Name'),
        item.get('Description'),
        item.get('miscCategory'),
        item.get('MediaURI')
      );
    }

    function setLootbox(api: StateAPI, item: any, droptables: any) {
      api.registry.item.create.lootbox(
        item.get('Index'),
        item.get('Name'),
        item.get('Description'),
        droptables[Number(item.get('Droptable')) - 1].get('Key'),
        droptables[Number(item.get('Droptable')) - 1].get('Tier'),
        item.get('MediaURI')
      );
    }

    ////////////////////
    // NPCS

    function initNpcs(api: StateAPI) {
      initMerchants(api);
    }

    function initMerchants(api: StateAPI) {
      // create our hottie merchant ugajin. names are unique
      api.npc.create(1, 'Mina', 13);

      api.listing.set(1, 1, 50, 0); // merchant index, item index, buy price, sell price
      api.listing.set(1, 2, 180, 0);
      api.listing.set(1, 3, 320, 0);
      api.listing.set(1, 1001, 500, 0);
    }

    ////////////////////
    // NODES

    function initNodes(api: StateAPI) {
      const allNodes = csvToMap(nodes);
      for (let i = 0; i < allNodes.length; i++) {
        try {
          api.node.create(
            Number(allNodes[i].get('Index')),
            allNodes[i].get('Type'),
            allNodes[i].get('RoomIndex'),
            allNodes[i].get('Name'),
            allNodes[i].get('Description'),
            allNodes[i].get('Affinity')
          );
        } catch {}
      }
    }

    function deleteNodes(api: StateAPI, indices: number[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.node.delete(indices[i]);
        } catch {
          console.error('Could not delete node ' + indices[i]);
        }
      }
    }

    ///////////////////
    // MINT FLOW

    function initGachaPool(api: StateAPI, numToMint: number) {
      // api.mint.gacha.init();
      // api.mint.batchMinter.init();
      // const batchSize = 8;
      // const numLoops = Math.floor(numToMint / batchSize);
      // for (let i = 0; i < numLoops; i++) {
      //   api.mint.batchMinter.mint(batchSize);
      // }
      // api.mint.batchMinter.mint(numToMint % batchSize);
    }

    ////////////////////
    // QUESTS

    function initQuests(api: StateAPI) {
      // create quests

      // quest 1
      api.registry.quest.create(
        1,
        'Welcome',
        "Welcome to Kamigotchi World.\n\nYou can move by opening the map menu - try the buttons on the top right. If you can work out how to move to room 4, we'll give you something special.",
        1,
        0
      );
      api.registry.quest.add.objective(1, 'Find the vending machine', 'BOOL_IS', 'ROOM', 4, 0);
      api.registry.quest.add.reward(1, 'MINT20', 0, 5);
      api.registry.quest.add.reward(1, 'QUEST_POINTS', 0, 1);

      // quest 2
      api.registry.quest.create(
        2,
        'Mint',
        "Well done.\n\nNow you've worked out how to move.But you won't be able to do much here unless you're able to get yourself a Kamigotchi.\n\nFind the vending machine.",
        2,
        0
      );
      api.registry.quest.add.requirement(2, 'COMPLETE', 'QUEST', 1, 0);
      api.registry.quest.add.objective(2, 'Mint a Kami', 'CURR_MIN', 'KAMI', 0, 1);
      api.registry.quest.add.reward(2, 'ITEM', 2, 1);
      api.registry.quest.add.reward(2, 'QUEST_POINTS', 0, 2);

      // quest 3
      api.registry.quest.create(
        3,
        'Harvest',
        'With your Kamigotchi, your existence now has meaning.\n\nSeek out a Node if you also wish for your existence to have MUSU.',
        4,
        0
      );
      api.registry.quest.add.requirement(3, 'COMPLETE', 'QUEST', 2, 0);
      api.registry.quest.add.objective(3, 'Harvest from a Node', 'INC_MIN', 'COIN_TOTAL', 0, 1);
      api.registry.quest.add.reward(3, 'ITEM', 1001, 1);
      api.registry.quest.add.reward(3, 'QUEST_POINTS', 0, 2);

      // quest 4
      api.registry.quest.create(
        4,
        'Farming 1: A Pocketful of $MUSU',
        "You've gotten a taste for harvesting now. Did you know you can leave your Kamigotchi to harvest while you explore? Just remember to come back in time....",
        0,
        0
      );
      api.registry.quest.add.requirement(4, 'COMPLETE', 'QUEST', 3, 0);
      api.registry.quest.add.objective(4, 'Harvest 100 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 100);
      api.registry.quest.add.reward(4, 'ITEM', 1001, 3);
      api.registry.quest.add.reward(4, 'QUEST_POINTS', 0, 3);

      // quest 5
      api.registry.quest.create(
        5,
        'Farming 2: Stacking $MUSU',
        "You're getting the hang of it. \n\nYour Kamigotchi will passively restore HP over time, but you can feed them if you want to get back to harvesting sooner…",
        0,
        0
      );
      api.registry.quest.add.requirement(5, 'COMPLETE', 'QUEST', 4, 0);
      api.registry.quest.add.objective(5, 'Harvest 1000 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 1000);
      api.registry.quest.add.reward(5, 'ITEM', 1001, 5);
      api.registry.quest.add.reward(5, 'QUEST_POINTS', 0, 4);

      // quest 6
      api.registry.quest.create(
        6,
        'Farming 3: Accumulating $MUSU',
        "Great, you're really taking this seriously. This one's a long haul. \n\nHope you're getting into a healthy routine with your Kamigotchi now. \n\nIf you haven't already noticed, there's plenty of secrets hidden around the world.",
        0,
        0
      );
      api.registry.quest.add.requirement(6, 'COMPLETE', 'QUEST', 5, 0);
      api.registry.quest.add.objective(6, 'Harvest 5000 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 5000);
      api.registry.quest.add.reward(6, 'ITEM', 1001, 10);
      api.registry.quest.add.reward(6, 'QUEST_POINTS', 0, 8);

      // quest 7
      api.registry.quest.create(7, 'Daily quest: Harvesting', 'Harvest 200 $MUSU', 0, 64800);
      api.registry.quest.add.objective(7, 'Harvest 200 $MUSU', 'INC_MIN', 'COIN_TOTAL', 0, 200);
      api.registry.quest.add.reward(7, 'ITEM', 10001, 1);

      // quest 8 and 9 have previously been repeatable quests for testing
      // can't use for new non-repeatable quests for backwards compatibility

      api.registry.quest.create(
        10,
        "Liquidation 1: An Unforgiving World/You're Not Alone ",
        "Your Kamigotchi has had enough of farming for now. Why don't you take it exploring? Remember to stock up on supplies and watch out. This is a Kami-eat-Kami world.\
      \n\nIf Kamigotchi are reduced to 0 Health on a Node and get tired, the other Kamigotchi may see them as just another resource to be claimed.\
      \n\nTry it out.If you have a Kamigotchi with a Violent nature, let it indulge.Liquidating exhausted Kami is another way to gain $MUSU.",
        0,
        0
      );
      api.registry.quest.add.requirement(10, 'COMPLETE', 'QUEST', 3, 0);
      api.registry.quest.add.objective(10, 'Liquidate 1 Kami', 'INC_MIN', 'LIQUIDATE', 0, 1);
      api.registry.quest.add.reward(10, 'ITEM', 5, 1);

      api.registry.quest.create(
        11,
        'Liquidation 3: Getting used to it/Harden Your Heart',
        'Liquidate ten more Kamigotchi and take their $MUSU. Kami lacking in spiritual Harmony will be your easiest targets.',
        0,
        0
      );
      api.registry.quest.add.requirement(11, 'COMPLETE', 'QUEST', 10, 0);
      api.registry.quest.add.objective(11, 'Liquidate 10 Kamis', 'INC_MIN', 'LIQUIDATE', 0, 10);
      api.registry.quest.add.reward(11, 'ITEM', 4, 1);
    }

    function deleteQuests(api: StateAPI, indices: number[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.registry.quest.delete(indices[i]);
        } catch {
          console.error('Could not delete quest ' + indices[i]);
        }
      }
    }

    ////////////////////
    // RELATIONSHIPS

    function initRelationships(api: StateAPI) {
      //        /->8->9-\
      // 1->2->3->4->5--->10
      //        \->6->7-/
      // top and bottom paths are mutually exclusive
      api.registry.relationship.create(1, 1, 'mina 1', [], []);
      api.registry.relationship.create(1, 2, 'mina 2', [1], []);
      api.registry.relationship.create(1, 3, 'mina 3', [2], []);
      api.registry.relationship.create(1, 4, 'mina 4', [3], []);
      api.registry.relationship.create(1, 5, 'mina 5', [4], []);
      api.registry.relationship.create(1, 6, 'mina 6', [3], [8]);
      api.registry.relationship.create(1, 7, 'mina 7', [6], [8]);
      api.registry.relationship.create(1, 8, 'mina 8', [3], [6]);
      api.registry.relationship.create(1, 9, 'mina 9', [8], [6]);
      api.registry.relationship.create(1, 10, 'mina 10', [5, 7, 9], []);
    }

    function deleteRelationships(api: StateAPI, npcs: number[], indices: number[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.registry.relationship.delete(npcs[i], indices[i]);
        } catch {
          console.error('Could not delete relationship ' + indices[i] + ' for npc ' + npcs[i]);
        }
      }
    }

    ////////////////////
    // SKILL

    function initSkills(api: any) {
      // Stat Skills
      api.registry.skill.create(
        1,
        'KAMI',
        'PASSIVE',
        'Vigor',
        1,
        3,
        '+10 Health per level',
        'images/skills/vigor.png'
      );
      api.registry.skill.add.effect(1, 'STAT', 'HEALTH', 'INC', 0, 10);

      api.registry.skill.create(
        2,
        'KAMI',
        'PASSIVE',
        'Acquisitiveness',
        1,
        3,
        '+1 Power per level',
        'images/skills/acquisitiveness.png'
      );
      api.registry.skill.add.effect(2, 'STAT', 'POWER', 'INC', 0, 1);

      api.registry.skill.create(
        3,
        'KAMI',
        'PASSIVE',
        'Aggression',
        1,
        3,
        '+1 Violence per level',
        'images/skills/aggression.png'
      );
      api.registry.skill.add.effect(3, 'STAT', 'VIOLENCE', 'INC', 0, 1);

      api.registry.skill.create(
        4,
        'KAMI',
        'PASSIVE',
        'Defensiveness',
        1,
        3,
        '+1 Harmony per level',
        'images/skills/defensiveness.png'
      );
      api.registry.skill.add.effect(4, 'STAT', 'HARMONY', 'INC', 0, 1);

      api.registry.skill.create(
        5,
        'KAMI',
        'PASSIVE',
        'Endurance',
        2,
        3,
        '+10 Health per level',
        'images/skills/endurance.png'
      );
      api.registry.skill.add.effect(5, 'STAT', 'HEALTH', 'INC', 0, 10);
      api.registry.skill.add.requirement(5, 'SKILL', 1, 3);

      api.registry.skill.create(
        6,
        'KAMI',
        'PASSIVE',
        'Predator',
        2,
        3,
        '+1 Power per level',
        'images/skills/predator.png'
      );
      api.registry.skill.add.effect(6, 'STAT', 'POWER', 'INC', 0, 1);
      api.registry.skill.add.requirement(6, 'SKILL', 2, 3);

      api.registry.skill.create(
        7,
        'KAMI',
        'PASSIVE',
        'Warmonger',
        2,
        3,
        '+1 Violence per level',
        'images/skills/warmonger.png'
      );
      api.registry.skill.add.effect(7, 'STAT', 'VIOLENCE', 'INC', 0, 1);
      api.registry.skill.add.requirement(7, 'SKILL', 3, 3);

      api.registry.skill.create(
        8,
        'KAMI',
        'PASSIVE',
        'Protector',
        2,
        3,
        '+1 Harmony per level',
        'images/skills/protector.png'
      );
      api.registry.skill.add.effect(8, 'STAT', 'HARMONY', 'INC', 0, 1);
      api.registry.skill.add.requirement(8, 'SKILL', 4, 3);

      // (Health) Skill Tree
      api.registry.skill.create(
        110,
        'KAMI',
        'PASSIVE',
        'Workout Routine',
        1,
        3,
        '-5% Harvest Drain per level',
        'images/skills/workout-routine.png'
      );
      api.registry.skill.add.effect(110, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
      api.registry.skill.add.requirement(110, 'SKILL', 1, 3);

      // (Power) Skill Tree
      api.registry.skill.create(
        201,
        'KAMI',
        'PASSIVE',
        'Greed',
        1,
        3,
        '+5% Harvest Output per level',
        'images/skills/greed.png'
      );
      api.registry.skill.add.effect(201, 'HARVEST', 'OUTPUT', 'INC', 0, 50);
      api.registry.skill.add.requirement(201, 'SKILL', 2, 3);

      api.registry.skill.create(
        202,
        'KAMI',
        'PASSIVE',
        'Leverage',
        2,
        3,
        '+7.5% Harvest Output per level',
        'images/skills/leverage.png'
      );
      api.registry.skill.add.effect(202, 'HARVEST', 'OUTPUT', 'INC', 0, 75);
      api.registry.skill.add.requirement(202, 'SKILL', 201, 3);

      api.registry.skill.create(
        203,
        'KAMI',
        'PASSIVE',
        'Looping',
        3,
        3,
        '+10% Harvest Output per level',
        'images/skills/looping.png'
      );
      api.registry.skill.add.effect(203, 'HARVEST', 'OUTPUT', 'INC', 0, 100);
      api.registry.skill.add.requirement(203, 'SKILL', 202, 3);

      api.registry.skill.create(
        204,
        'KAMI',
        'PASSIVE',
        'Degenerate',
        3,
        3,
        '+12.5% Harvest Output per level',
        'images/skills/degenerate.png'
      );
      api.registry.skill.add.effect(204, 'HARVEST', 'OUTPUT', 'INC', 0, 125);
      api.registry.skill.add.requirement(204, 'SKILL', 203, 3);

      api.registry.skill.create(
        210,
        'KAMI',
        'PASSIVE',
        'Sunglasses Ownership',
        1,
        3,
        '-5% Harvest Drain per level',
        'images/skills/sunglasses-ownership.png'
      );
      api.registry.skill.add.effect(210, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
      api.registry.skill.add.requirement(210, 'SKILL', 2, 3);

      api.registry.skill.create(
        220,
        'KAMI',
        'PASSIVE',
        'Bandit',
        1,
        3,
        '-20s Harvest Cooldown per level',
        'images/skills/bandit.png'
      );
      api.registry.skill.add.effect(220, 'HARVEST', 'COOLDOWN', 'INC', 0, 20);
      api.registry.skill.add.requirement(220, 'SKILL', 2, 3);

      // (Violence) Skill Tree
      api.registry.skill.create(
        320,
        'KAMI',
        'PASSIVE',
        'Sniper',
        1,
        3,
        '-20s Attack Cooldown per level',
        'images/skills/sniper.png'
      );
      api.registry.skill.add.effect(320, 'ATTACK', 'COOLDOWN', 'INC', 0, 20);
      api.registry.skill.add.requirement(320, 'SKILL', 3, 3);

      // (Harmony) Skill Tree
      api.registry.skill.create(
        401,
        'KAMI',
        'PASSIVE',
        'Patience',
        1,
        3,
        '-5% Harvest Drain per level',
        'images/skills/patience.png'
      );
      api.registry.skill.add.effect(401, 'HARVEST', 'DRAIN', 'DEC', 0, 50);
      api.registry.skill.add.requirement(401, 'SKILL', 4, 3);
    }

    function deleteSkills(api: StateAPI, indices: number[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.registry.skill.delete(indices[i]);
        } catch {
          console.error('Could not delete skill ' + indices[i]);
        }
      }
    }

    ////////////////////
    // TRAITS

    function initTraits(api: StateAPI) {
      // inits a single type of trait, returns number of traits
      function initSingle(dataRaw: any, type: string) {
        const data = csvToMap(dataRaw);
        for (let i = 0; i < data.length; i++) {
          api.registry.trait.create(
            data[i].get('Index'), // individual trait index
            data[i].get('Health') ? data[i].get('Health') : 0,
            data[i].get('Power') ? data[i].get('Power') : 0,
            data[i].get('Violence') ? data[i].get('Violence') : 0,
            data[i].get('Harmony') ? data[i].get('Harmony') : 0,
            data[i].get('Slots') ? data[i].get('Slots') : 0,
            data[i].get('Tier') ? data[i].get('Tier') : 0,
            data[i].get('Affinity') ? data[i].get('Affinity').toUpperCase() : '',
            data[i].get('Name'), // name of trait
            type // type: body, color, etc
          );
        }

        // -1 because max includes 0, should remove this
        return data.length - 1;
      }

      initSingle(background, 'BACKGROUND');
      initSingle(body, 'BODY');
      initSingle(color, 'COLOR');
      initSingle(face, 'FACE');
      initSingle(hand, 'HAND');
    }

    // try to update traits. meant for partial deployments to fill up the gaps
    function initTraitsWithFail(api: StateAPI) {
      // inits a single type of trait, returns number of traits
      function initSingle(dataRaw: any, type: string) {
        const data = csvToMap(dataRaw);
        for (let i = 0; i < data.length; i++) {
          try {
            api.registry.trait.create(
              data[i].get('Index'), // individual trait index
              data[i].get('Health') ? data[i].get('Health') : 0,
              data[i].get('Power') ? data[i].get('Power') : 0,
              data[i].get('Violence') ? data[i].get('Violence') : 0,
              data[i].get('Harmony') ? data[i].get('Harmony') : 0,
              data[i].get('Slots') ? data[i].get('Slots') : 0,
              data[i].get('Tier') ? data[i].get('Tier') : 0,
              data[i].get('Affinity') ? data[i].get('Affinity').toUpperCase() : '',
              data[i].get('Name'), // name of trait
              type // type: body, color, etc
            );
          } catch {}
        }

        // -1 because max includes 0, should remove this
        return data.length - 1;
      }

      initSingle(background, 'BACKGROUND');
      initSingle(body, 'BODY');
      initSingle(color, 'COLOR');
      initSingle(face, 'FACE');
      initSingle(hand, 'HAND');
    }

    function deleteTraits(api: StateAPI, indices: number[], types: string[]) {
      for (let i = 0; i < indices.length; i++) {
        try {
          api.registry.trait.delete(indices[i], types[i]);
        } catch {
          console.error('Could not delete trait ' + indices[i]);
        }
      }
    }

    //////////////////////
    // UTILS

    // converts csv to array of maps
    function csvToMap(arr: any) {
      let jsonObj = [];
      let headers = arr[0];
      for (let i = 1; i < arr.length; i++) {
        let data = arr[i];
        let mp = new Map();
        for (let j = 0; j < data.length; j++) {
          mp.set(headers[j].trim(), data[j].trim() ? data[j].trim() : '0');
        }
        jsonObj.push(mp);
      }
      return jsonObj;
    }

    function csvToCoords(arr: any) {
      const mp = new Map();
      for (let i = 1; i < arr.length; i++) {
        let data = arr[i];
        for (let j = 2; j < data.length; j++) {
          if (data[j].trim() !== '') {
            const name = data[j].split('(')[0].trim();
            mp.set(name, {
              x: Number(arr[0][j].trim()),
              y: Number(data[0].trim()),
              z: Number(data[1].trim()),
            });
          }
        }
      }
      return mp;
    }

    /* Layed CSV to a array of map. This is to parse 2d data in notion (eg droptables)
     * eg: Index | Key   | Tier (Weight)
     *     1     |       |
     *           | 1     | 8
     *           | 2     | 9
     *     2     |       |
     *           | 3     | 6
     * would result in:
     * [
     *   {
     *     Key: [1, 2],
     *     Tier: [8, 9]
     *   },
     *   {
     *    Key: [3],
     *   Tier: [6]
     *   }
     * ]
     **/
    function csvLayeredToMap(arr: any) {
      let results = [];
      let headers = arr[0];
      for (let i = 1; i < arr.length; i++) {
        let data = arr[i];
        if (data[0] != '') {
          let mp = new Map();
          for (let n = 1; n < headers.length; n++) {
            mp.set(headers[n].trim(), []);
          }
          for (let j = i + 1; j < arr.length && arr[j][0] === ''; j++) {
            data = arr[j];
            for (let k = 1; k < headers.length; k++) {
              mp.get(headers[k].trim()).push(data[k].trim() ? data[k].trim() : '0');
            }
            i = j - 1;
          }
          results.push(mp);
        }
      }
      return results;
    }

    return {
      init: initAll,
      config: {
        init: () => initConfig(api),
      },
      items: {
        init: () => initItems(api),
        delete: (indices: number[]) => deleteItems(api, indices),
      },
      npcs: {
        init: () => initNpcs(api),
      },
      nodes: {
        init: () => initNodes(api),
        delete: (indices: number[]) => deleteNodes(api, indices),
      },
      mint: {
        init: (n: number) => initGachaPool(api, n),
      },
      quests: {
        init: () => initQuests(api),
        delete: (indices: number[]) => deleteQuests(api, indices),
      },
      relationships: {
        init: () => initRelationships(api),
        delete: (npcs: number[], indices: number[]) => deleteRelationships(api, indices, npcs),
      },
      rooms: {
        init: () => initRooms(api),
        delete: (indices: number[]) => deleteRooms(api, indices),
      },
      skill: {
        init: () => initSkills(api),
        delete: (indices: number[]) => deleteSkills(api, indices),
      },
      traits: {
        init: () => initTraits(api),
        tryInit: () => initTraitsWithFail(api),
        delete: (indices: number[], types: string[]) => deleteTraits(api, indices, types),
      },
    };
  }
}

function readFile(file: string): string {
  const fs = require('fs');
  const path = require('path');
  const result = fs.readFileSync(path.join(__dirname, 'data/', file), 'utf8');
  return result;
}

function writeOutput(data: string[]) {
  let result = `{\n"calls":\n` + JSON.stringify(data, null, 2) + '\n}';
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, '../contracts/', 'initStream.json'), result, {
    encoding: 'utf8',
  });
}
