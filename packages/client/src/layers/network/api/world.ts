import { AdminAPI, createAdminAPI } from './admin';
import { createPlayerAPI } from './player';
import { utils } from 'ethers';

import items from 'assets/data/items/Items.csv';
import droptables from 'assets/data/items/Droptables.csv';
import background from 'assets/data/kami/Background.csv';
import body from 'assets/data/kami/Body.csv';
import color from 'assets/data/kami/Color.csv';
import face from 'assets/data/kami/Face.csv';
import hand from 'assets/data/kami/Hand.csv';

export function setUpWorldAPI(systems: any) {
  async function initAll() {
    const api = createAdminAPI(systems);

    await initConfig(api);
    await initRooms(api);
    await initNodes(api);
    await initItems(api);
    await initNpcs(api);
    await initQuests(api);
    await initSkills(api);
    await initTraits(api);
    await initRelationships(api);

    if (!process.env.MODE || process.env.MODE == 'DEV') {
      await initLocalConfig(api);
    }

    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer',
      'fudge',
    );
  }

  ///////////////////
  // CONFIG

  async function initConfig(api: AdminAPI) {
    await api.config.set.string('BASE_URI', 'https://image.asphodel.io/kami/');

    // Leaderboards
    await api.config.set.number('LEADERBOARD_EPOCH', 1);

    // Account Stamina
    await api.config.set.number('ACCOUNT_STAMINA_BASE', 20);
    await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

    // Kami Idle Requirement
    await api.config.set.number('KAMI_IDLE_REQ', 180);

    // Kami Mint Price and Limits
    // to be 5, set at 500 for testing
    await api.config.set.number('MINT_ACCOUNT_MAX', 5);
    await api.config.set.number('MINT_INITIAL_MAX', 1111);
    await api.config.set.number('MINT_TOTAL_MAX', 4444);
    await api.config.set.number('MINT_PRICE', utils.parseEther('0.0'));

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
    await api.config.set.number('HEALTH_RATE_DRAIN_BASE', 40); // in respect to harvest rate
    await api.config.set.number('HEALTH_RATE_DRAIN_BASE_PREC', 2); // i.e. x/100
    await api.config.set.number('HEALTH_RATE_HEAL_PREC', 9); // ignore this, for consistent math on SC
    await api.config.set.number('HEALTH_RATE_HEAL_BASE', 150); // in respect to harmony
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
  async function initLocalConfig(api: AdminAPI) {
    await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 10);
    await api.config.set.number('KAMI_IDLE_REQ', 10);
    await api.config.set.number('KAMI_LVL_REQ_BASE', 10); // experience required for level 1->2
    await api.config.set.number('HARVEST_RATE_BASE', 10000); // in respect to power
    await api.config.set.number('HEALTH_RATE_HEAL_BASE', 10000); // in respect to harmony
  }


  ////////////////////
  // ROOMS

  async function initRooms(api: AdminAPI) {
    await api.room.create(0, 'deadzone', '', [1]); // in case we need this
    await api.room.create(
      1,
      'Misty Riverside',
      'A dark forest, the sky above blotted out by trees. Blue butterflies flutter around, looking lost.',
      [2]
    );
    await api.room.create(
      2,
      'Tunnel of Trees',
      'The light at the end of the tunnel; a way out of the forest. Also, a blue door made of light hangs in the air - it says “SHOP”.',
      [1, 3, 13]
    );
    await api.room.create(
      3,
      'Torii Gate',
      'This road is overgrown and disappears in the grass before a large wooden gate. Behind it the forest changes, swelling and darkening.\nHills of garbage seem to be growing out of the ground in the distance and mark a horizon against the blue sky.',
      [2, 4]
    );
    await api.room.create(
      4,
      'Vending Machine',
      'Day turns into night here deep in the scrap. The vending machine bleeps happily despite lacking a power cord. A long-tailed comet bravely dives across the sky.',
      [3, 5, 12]
    );
    await api.room.create(
      5,
      'Restricted Area',
      'A paved road lined with cherry trees leads away from the junkyard, toward a large office complex.',
      [4, 6, 9]
    );
    await api.room.create(
      6,
      'Labs Entrance',
      'The office building\'s exterior is in disrepair. A breeze is slowly shifting the air.',
      [5, 7]
    );
    await api.room.create(
      7,
      'Lobby',
      'The doors close around a sparsely decorated lobby. A blue roof and white walls, with blue skirting framing an elevator.',
      [6, 8, 14]
    );
    await api.room.create(
      8,
      'Junk Shop',
      'This electrical room has been converted into a living space and workshop. The walls are covered in panels and buttons. A prickly, burnt smell lingers in the air.',
      [7]
    );
    await api.room.create(
      9,
      'Old Growth',
      'The forest is older here, and untouched, long vines and moss climbing the trees. Giant insects cause a ruckus with their ceaseless buzzing.',
      [5, 10, 11]
    );
    await api.room.create(
      10,
      'Insect Node',
      'A procession of insects is slowly moving towards the great mound here. The buzzing creates an overwhelming cacophony as you approach.',
      [9]
    );
    await api.room.create(
      11,
      'Waterfall Shrine',
      'A large waterfall creates a cool and invigorating mist here. Before the basin stands a whispering shrine.',
      [9, 15]
    );
    await api.room.create(
      12,
      'Machine Node',
      'Deep in the scrapyard a collection of strange objects are vibrating, screeching, pulsating, whispering, cackling, hissing and in general making a disturbance.',
      [4]
    );
    await api.room.create(
      13,
      'Convenience Store',
      'The shop walls are lined with exotically stocked shelves. Behind the counter stands a woman occupied with the snake coiled around her neck.',
      [2]
    );
    await api.room.create(
      14,
      "Manager's Office",
      'A stylish penthouse office with a view. It\'s seen a bit of a commotion.',
      [7]
    );
    await api.room.create(
      15,
      'Temple Cave',
      'A cave behind the waterfall. Friendly statues line a path to the back of the cave away from ancient-looking temple ruins.',
      [11, 16, 18]
    );
    await api.room.create(
      16,
      'Techno Temple',
      'Inside the ruined temple. This place might have been traditional once, but now it sparks and rumbles with technology.',
      [15]
    );
    // await api.room.create(17, "Misty Park", 'You appear to be outside in an urban park. Balls of light dance around a statue of an angel. Fog hangs thick in the air.', [0]);
    await api.room.create(
      18,
      'Cave Crossroads',
      'Deep in the cave the path branches. The bioluminescent fungi make it nearly as bright as day. You can hear bells in the air.',
      [15, 19]
    );
    await api.room.create(
      19,
      'Violence Temple',
      'Half eroded stone and mossy growth, half gleaming metal and glowing crystal. Whether temple or technology, it unsettles you.',
      [18]
    );
  }

  ////////////////////
  // ITEMS

  async function initItems(api: AdminAPI) {
    const allItems = csvToMap(items);
    const allDroptables = csv2dToMap(droptables);

    for (let i = 0; i < allItems.length; i++) {
      await sleepIf();
      try {
        switch (allItems[i].get('Type').toUpperCase()) {
          case "FOOD":
            await setFood(api, allItems[i]);
            break;
          case "REVIVE":
            await setRevive(api, allItems[i]);
            break;
          case "LOOTBOX":
            await setLootbox(api, allItems[i], allDroptables);
            break;
          default:
            console.error("Item type not found: " + allItems[i].get('Type'));
        }
      } catch { }
    }
  }

  async function setFood(api: AdminAPI, item: any) {
    await api.registry.item.create.food(
      item.get('Index'),
      item.get('FamilyIndex(depreciated)'),
      item.get('Name'),
      item.get('Description'),
      item.get('Health'),
      item.get('XP'),
      item.get('MediaURI')
    );
  }

  async function setRevive(api: AdminAPI, item: any) {
    await api.registry.item.create.revive(
      item.get('Index'),
      item.get('FamilyIndex(depreciated)'),
      item.get('Name'),
      item.get('Description'),
      item.get('Health'),
      item.get('MediaURI')
    );
  }

  async function setLootbox(api: AdminAPI, item: any, droptables: any) {
    await api.registry.item.create.lootbox(
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

  async function initNpcs(api: AdminAPI) {
    await initMerchants(api);
  }

  async function initMerchants(api: AdminAPI) {
    // create our hottie merchant ugajin. names are unique
    await api.npc.create(1, 'Mina', 13);

    await api.listing.set(1, 1, 25, 0); // merchant index, item index, buy price, sell price
    await api.listing.set(1, 2, 90, 0);
    await api.listing.set(1, 3, 150, 0);
    await api.listing.set(1, 1001, 500, 0);
  }


  ////////////////////
  // NODES

  async function initNodes(api: AdminAPI) {
    await api.node.create(
      1,
      'HARVEST',
      3,
      'Torii Gate',
      `These gates usually indicate sacred areas. If you have Kamigotchi, this might be a good place to have them gather $MUSU....`,
      `NORMAL`,
    );

    await api.node.create(
      2,
      'HARVEST',
      7,
      'Trash Compactor',
      'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.',
      'SCRAP',
    );

    await api.node.create(
      3,
      'HARVEST',
      10,
      'Termite Mound',
      'A huge termite mound. Apparently, this is sacred to the local insects.',
      'INSECT',
    );

    await api.node.create(
      4,
      'HARVEST',
      14,
      'Occult Circle',
      'The energy existing here exudes an eeriness that calls out to EERIE Kamigotchi.',
      'EERIE',
    );

    await api.node.create(
      5,
      'HARVEST',
      12,
      'Monolith',
      'This huge black monolith seems to draw in energy from the rest of the junkyard.',
      'SCRAP',
    );
  }


  ////////////////////
  // QUESTS

  async function initQuests(api: AdminAPI) {
    // create quests

    // quest 1
    await api.registry.quest.create(
      1,
      "Welcome",
      "Welcome to Kamigotchi World.\n\nYou can move by opening the map menu - try the buttons on the top right. If you can work out how to move to room 4, we'll give you something special.",
      1,
      0
    );
    await api.registry.quest.add.objective(1, "Find the vending machine", "AT", "ROOM", 0, 4);
    await api.registry.quest.add.reward(1, "MINT20", 0, 5);

    // quest 2
    await api.registry.quest.create(
      2,
      "Mint",
      "Well done.\n\nNow you've worked out how to move.But you won't be able to do much here unless you're able to get yourself a Kamigotchi.\n\nFind the vending machine.",
      2,
      0
    );
    await api.registry.quest.add.requirement(2, "COMPLETE", "QUEST", 0, 1);
    await api.registry.quest.add.objective(2, "Mint a Kami", "MINT", "PET721_MINT", 0, 1);
    await api.registry.quest.add.reward(2, "ITEM", 2, 1);

    // quest 3
    await api.registry.quest.create(
      3,
      "Harvest",
      "With your Kamigotchi, your existence now has meaning.\n\nSeek out a Node if you also wish for your existence to have MUSU.",
      4,
      0
    );
    await api.registry.quest.add.requirement(3, "COMPLETE", "QUEST", 0, 2);
    await api.registry.quest.add.objective(3, "Harvest from a Node", "GATHER", "COIN_TOTAL", 0, 1);
    await api.registry.quest.add.reward(3, "ITEM", 1001, 1);

    // quest 4
    await api.registry.quest.create(
      4,
      "Farming 1: A Pocketful of $MUSU",
      "You've gotten a taste for harvesting now. Did you know you can leave your Kamigotchi to harvest while you explore? Just remember to come back in time....",
      0,
      0
    );
    await api.registry.quest.add.requirement(4, "COMPLETE", "QUEST", 0, 3);
    await api.registry.quest.add.objective(4, "Harvest 100 $MUSU", "GATHER", "COIN_TOTAL", 0, 100);
    await api.registry.quest.add.reward(4, "ITEM", 1001, 3);

    // quest 5
    await api.registry.quest.create(
      5,
      "Farming 2: Stacking $MUSU",
      "You're getting the hang of it. \n\nYour Kamigotchi will passively restore HP over time, but you can feed them if you want to get back to harvesting sooner…",
      0,
      0
    );
    await api.registry.quest.add.requirement(5, "COMPLETE", "QUEST", 0, 4);
    await api.registry.quest.add.objective(5, "Harvest 1000 $MUSU", "GATHER", "COIN_TOTAL", 0, 1000);
    await api.registry.quest.add.reward(5, "ITEM", 1001, 5);

    // quest 6
    await api.registry.quest.create(
      6,
      "Farming 3: Accumulating $MUSU",
      "Great, you're really taking this seriously. This one's a long haul. \n\nHope you're getting into a healthy routine with your Kamigotchi now. \n\nIf you haven't already noticed, there's plenty of secrets hidden around the world.",
      0,
      0
    );
    await api.registry.quest.add.requirement(6, "COMPLETE", "QUEST", 0, 5);
    await api.registry.quest.add.objective(6, "Harvest 5000 $MUSU", "GATHER", "COIN_TOTAL", 0, 5000);
    await api.registry.quest.add.reward(6, "ITEM", 1001, 10);

    // quest 7
    await api.registry.quest.create(
      7,
      "Daily quest: Harvesting",
      "Harvest 200 $MUSU",
      0,
      64800
    );
    await api.registry.quest.add.objective(7, "Harvest 200 $MUSU", "GATHER", "COIN_TOTAL", 0, 200);
    await api.registry.quest.add.reward(7, "ITEM", 10001, 1); // temp lootbox handler
  }


  ////////////////////
  // RELATIONSHIPS

  async function initRelationships(api: AdminAPI) {
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

  ////////////////////
  // SKILL

  async function initSkills(api: any) {
    // Stat Skills
    await api.registry.skill.create(1, "KAMI", "PASSIVE", "Vigor", 1, 3, "+10 Health per level", "images/skills/vigor.png");
    await api.registry.skill.add.effect(1, "STAT", "HEALTH", "INC", 0, 10);

    await api.registry.skill.create(2, "KAMI", "PASSIVE", "Acquisitiveness", 1, 3, "+1 Power per level", "images/skills/acquisitiveness.png");
    await api.registry.skill.add.effect(2, "STAT", "POWER", "INC", 0, 1);

    await api.registry.skill.create(3, "KAMI", "PASSIVE", "Aggression", 1, 3, "+1 Violence per level", "images/skills/aggression.png");
    await api.registry.skill.add.effect(3, "STAT", "VIOLENCE", "INC", 0, 1);

    await api.registry.skill.create(4, "KAMI", "PASSIVE", "Defensiveness", 1, 3, "+1 Harmony per level", "images/skills/defensiveness.png");
    await api.registry.skill.add.effect(4, "STAT", "HARMONY", "INC", 0, 1);

    await api.registry.skill.create(5, "KAMI", "PASSIVE", "Endurance", 2, 3, "+10 Health per level", "images/skills/endurance.png");
    await api.registry.skill.add.effect(5, "STAT", "HEALTH", "INC", 0, 10);
    await api.registry.skill.add.requirement(5, "SKILL", 1, 3);

    await api.registry.skill.create(6, "KAMI", "PASSIVE", "Predator", 2, 3, "+1 Power per level", "images/skills/predator.png");
    await api.registry.skill.add.effect(6, "STAT", "POWER", "INC", 0, 1);
    await api.registry.skill.add.requirement(6, "SKILL", 2, 3);

    await api.registry.skill.create(7, "KAMI", "PASSIVE", "Warmonger", 2, 3, "+1 Violence per level", "images/skills/warmonger.png");
    await api.registry.skill.add.effect(7, "STAT", "VIOLENCE", "INC", 0, 1);
    await api.registry.skill.add.requirement(7, "SKILL", 3, 3);

    await api.registry.skill.create(8, "KAMI", "PASSIVE", "Protector", 2, 3, "+1 Harmony per level", "images/skills/protector.png");
    await api.registry.skill.add.effect(8, "STAT", "HARMONY", "INC", 0, 1);
    await api.registry.skill.add.requirement(8, "SKILL", 4, 3);


    // (Health) Skill Tree
    await api.registry.skill.create(110, "KAMI", "PASSIVE", "Workout Routine", 1, 3, "-5% Harvest Drain per level", "images/skills/workout-routine.png");
    await api.registry.skill.add.effect(110, "HARVEST", "DRAIN", "DEC", 0, 50);
    await api.registry.skill.add.requirement(110, "SKILL", 1, 3);


    // (Power) Skill Tree
    await api.registry.skill.create(201, "KAMI", "PASSIVE", "Greed", 1, 3, "+5% Harvest Output per level", "images/skills/greed.png");
    await api.registry.skill.add.effect(201, "HARVEST", "OUTPUT", "INC", 0, 50);
    await api.registry.skill.add.requirement(201, "SKILL", 2, 3);

    await api.registry.skill.create(202, "KAMI", "PASSIVE", "Leverage", 2, 3, "+7.5% Harvest Output per level", "images/skills/leverage.png");
    await api.registry.skill.add.effect(202, "HARVEST", "OUTPUT", "INC", 0, 75);
    await api.registry.skill.add.requirement(202, "SKILL", 201, 3);

    await api.registry.skill.create(203, "KAMI", "PASSIVE", "Looping", 3, 3, "+10% Harvest Output per level", "images/skills/looping.png");
    await api.registry.skill.add.effect(203, "HARVEST", "OUTPUT", "INC", 0, 100);
    await api.registry.skill.add.requirement(203, "SKILL", 202, 3);

    await api.registry.skill.create(204, "KAMI", "PASSIVE", "Degenerate", 3, 3, "+12.5% Harvest Output per level", "images/skills/degenerate.png");
    await api.registry.skill.add.effect(204, "HARVEST", "OUTPUT", "INC", 0, 125);
    await api.registry.skill.add.requirement(204, "SKILL", 203, 3);

    await api.registry.skill.create(210, "KAMI", "PASSIVE", "Sunglasses Ownership", 1, 3, "-5% Harvest Drain per level", "images/skills/sunglasses-ownership.png");
    await api.registry.skill.add.effect(210, "HARVEST", "DRAIN", "DEC", 0, 50);
    await api.registry.skill.add.requirement(210, "SKILL", 2, 3);

    await api.registry.skill.create(220, "KAMI", "PASSIVE", "Bandit", 1, 3, "-20s Harvest Cooldown per level", "images/skills/bandit.png");
    await api.registry.skill.add.effect(220, "HARVEST", "COOLDOWN", "INC", 0, 20);
    await api.registry.skill.add.requirement(220, "SKILL", 2, 3);


    // (Violence) Skill Tree
    await api.registry.skill.create(320, "KAMI", "PASSIVE", "Sniper", 1, 3, "-20s Attack Cooldown per level", "images/skills/sniper.png");
    await api.registry.skill.add.effect(320, "ATTACK", "COOLDOWN", "INC", 0, 20);
    await api.registry.skill.add.requirement(320, "SKILL", 3, 3);


    // (Harmony) Skill Tree
    await api.registry.skill.create(401, "KAMI", "PASSIVE", "Patience", 1, 3, "-5% Harvest Drain per level", "images/skills/patience.png");
    await api.registry.skill.add.effect(401, "HARVEST", "DRAIN", "DEC", 0, 50);
    await api.registry.skill.add.requirement(401, "SKILL", 4, 3);
  }


  ////////////////////
  // TRAITS

  async function initTraits(api: AdminAPI) {
    // inits a single type of trait, returns number of traits
    async function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        await sleepIf();
        api.registry.trait.create(
          data[i].get("Index"), // individual trait index
          data[i].get("Health") ? data[i].get("Health") : 0,
          data[i].get("Power") ? data[i].get("Power") : 0,
          data[i].get("Violence") ? data[i].get("Violence") : 0,
          data[i].get("Harmony") ? data[i].get("Harmony") : 0,
          data[i].get("Slots") ? data[i].get("Slots") : 0,
          data[i].get("Tier") ? data[i].get("Tier") : 0,
          data[i].get("Affinity") ? data[i].get("Affinity").toUpperCase() : "",
          data[i].get("Name"), // name of trait
          type, // type: body, color, etc
        );
      }

      // -1 because max includes 0, should remove this
      return data.length - 1;
    }

    await initSingle(background, "BACKGROUND");
    await initSingle(body, "BODY");
    await initSingle(color, "COLOR");
    await initSingle(face, "FACE");
    await initSingle(hand, "HAND");
  }

  // try to update traits. meant for partial deployments to fill up the gaps
  async function initTraitsWithFail(api: AdminAPI) {
    // inits a single type of trait, returns number of traits
    async function initSingle(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        await sleepIf();
        try {
          api.registry.trait.create(
            data[i].get("Index"), // individual trait index
            data[i].get("Health") ? data[i].get("Health") : 0,
            data[i].get("Power") ? data[i].get("Power") : 0,
            data[i].get("Violence") ? data[i].get("Violence") : 0,
            data[i].get("Harmony") ? data[i].get("Harmony") : 0,
            data[i].get("Slots") ? data[i].get("Slots") : 0,
            data[i].get("Tier") ? data[i].get("Tier") : 0,
            data[i].get("Affinity") ? data[i].get("Affinity").toUpperCase() : "",
            data[i].get("Name"), // name of trait
            type, // type: body, color, etc
          );
        } catch { }
      }

      // -1 because max includes 0, should remove this
      return data.length - 1;
    }

    await initSingle(background, "BACKGROUND");
    await initSingle(body, "BODY");
    await initSingle(color, "COLOR");
    await initSingle(face, "FACE");
    await initSingle(hand, "HAND");
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
        mp.set(headers[j].trim(), data[j].trim() ? data[j].trim() : "0");
      }
      jsonObj.push(mp);
    }
    return jsonObj;
  }

  /* 2D CSV to a array of map. This is to parse 2d data in notion (eg droptables)
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
  function csv2dToMap(arr: any) {
    let results = [];
    let headers = arr[0];
    for (let i = 1; i < arr.length; i++) {
      let data = arr[i];
      if (data[0] != "") {
        let mp = new Map();
        for (let n = 1; n < headers.length; n++) {
          mp.set(headers[n].trim(), []);
        }
        for (let j = i + 1; j < arr.length && arr[j][0] === ""; j++) {
          data = arr[j];
          for (let k = 1; k < headers.length; k++) {
            mp.get(headers[k].trim()).push(data[k].trim() ? data[k].trim() : "0");
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
      init: () => initConfig(createAdminAPI(systems)),
    },
    items: {
      init: () => initItems(createAdminAPI(systems)),
    },
    npcs: {
      init: () => initNpcs(createAdminAPI(systems)),
    },
    nodes: {
      init: () => initNodes(createAdminAPI(systems)),
    },
    quests: {
      init: () => initQuests(createAdminAPI(systems)),
    },
    relationships: {
      init: () => initRelationships(createAdminAPI(systems)),
    },
    rooms: {
      init: () => initRooms(createAdminAPI(systems)),
    },
    skill: {
      init: () => initSkills(createAdminAPI(systems)),
    },
    traits: {
      init: () => initTraits(createAdminAPI(systems)),
      tryInit: () => initTraitsWithFail(createAdminAPI(systems)),
    },
  }

  function sleepIf() {
    if (process.env.MODE == 'OPGOERLI') {
      return new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}



