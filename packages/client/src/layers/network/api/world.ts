import { AdminAPI, createAdminAPI } from './admin';
import { createPlayerAPI } from './player';
import { utils } from 'ethers';

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
      'load_bearer'
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
    await api.config.set.number('HARVEST_RATE_MULT_PREC', 4); // should be hardcoded to 2x HARVEST_RATE_MULT_AFF_PREC
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
      'You have no memory of arriving here. The air is quiet. The trees grow so thick overhead that it would still be dark at noon.',
      [2]
    );
    await api.room.create(
      2,
      'Tunnel of Trees',
      'You see the light at the end of the tunnel; a way out of the forest. Also, you see a blue door made of light. It says “SHOP”.',
      [1, 3, 13]
    );
    await api.room.create(
      3,
      'Torii Gate',
      'The end of the road. This gate seems to mark the transition between the misty forest and the massive scrapyard.',
      [2, 4]
    );
    await api.room.create(
      4,
      'Vending Machine',
      'Deep in the scrap you find a vending machine well stocked and operating. Behind it you see the power cord is cut off.',
      [3, 5, 12]
    );
    await api.room.create(
      5,
      'Restricted Area',
      'A restricted area. Follow the road lined with cherry trees to reach an office complex. Across from the office is another forest.',
      [4, 6, 9]
    );
    await api.room.create(
      6,
      'Labs Entrance',
      'This exterior seems designed to resemble a shrine almost as much as it does a corporate office building.',
      [5, 7]
    );
    await api.room.create(
      7,
      'Lobby',
      'The lobby decor is sparse, with only one uncomfortable chair. The elevator buttons are broken except for “B” and “PH”.',
      [6, 8, 14]
    );
    await api.room.create(
      8,
      'Junk Shop',
      'The electrical room in the basement has been converted into a living space and workshop. Do people live like this?',
      [7]
    );
    await api.room.create(
      9,
      'Old Growth',
      'You step into the forest and seem to enter a primordial age. The buzz of giant insects overwhelms your hearing.',
      [5, 10, 11]
    );
    await api.room.create(
      10,
      'Insect Node',
      'The buzzing is loudest here. This mound draws insects of all types toward it. They writhe together in a trance.',
      [9]
    );
    await api.room.create(
      11,
      'Waterfall Shrine',
      'By the edge of the waterfall basin, a humble shrine grants this place a peaceful aura.',
      [9, 15]
    );
    await api.room.create(
      12,
      'Machine Node',
      'A collection of strange and hard to identify objects is buried deep in the scrapyard. It feels dangerous just to be near them.',
      [4]
    );
    await api.room.create(
      13,
      'Convenience Store',
      'The glowing blue door transports you inside of a little candy store. Check the glowing “exit” sign to leave.',
      [2]
    );
    await api.room.create(
      14,
      "Manager's Office",
      'A slick penthouse office. It seems that this room has been untouched since a magic ritual was performed inside.',
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
    await initFood(api);
    await initLootbox(api);
  }

  async function initFood(api: AdminAPI) {
    await api.registry.food.create(1, 'Maple-Flavor Ghost Gum', 25);
    await api.registry.food.create(2, 'Pom-Pom Fruit Candy', 100);
    await api.registry.food.create(3, 'Gakki Cookie Sticks', 200);
    await api.registry.revive.create(1, 'Red Gakki Ribbon', 10);
  }

  async function initLootbox(api: AdminAPI) {
    // @dev temp lootbox holder, droptable consists of food above
    await api.registry.lootbox.create(1000, [1, 2, 3], [3, 2, 1], 'Lootbox');
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
    await api.listing.set(1, 4, 500, 0);
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
    await api.registry.quest.add.objective(1, "Move to room 4", "AT", "ROOM", 0, 4);
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
    await api.registry.quest.add.reward(2, "FOOD", 2, 1);

    // quest 3
    await api.registry.quest.create(
      3,
      "Harvest",
      "With your Kamigotchi, your existence now has meaning.\n\nSeek out a Node if you also wish for your existence to have MUSU.",
      4,
      0
    );
    await api.registry.quest.add.requirement(3, "COMPLETE", "QUEST", 0, 2);
    await api.registry.quest.add.objective(3, "Harvest from a Node", "GATHER", "COIN_HAS", 0, 1);
    await api.registry.quest.add.reward(3, "REVIVE", 1, 1);

    // quest 4
    await api.registry.quest.create(
      4,
      "Farming 1: A Pocketful of $MUSU",
      "You've gotten a taste for harvesting now. Did you know you can leave your Kamigotchi to harvest while you explore? Just remember to come back in time....",
      0,
      0
    );
    await api.registry.quest.add.requirement(4, "COMPLETE", "QUEST", 0, 3);
    await api.registry.quest.add.objective(4, "Harvest 100 $MUSU", "GATHER", "COIN_HAS", 0, 100);
    await api.registry.quest.add.reward(4, "REVIVE", 1, 3);

    // quest 5
    await api.registry.quest.create(
      5,
      "Farming 2: Stacking $MUSU",
      "You're getting the hang of it. \n\nYour Kamigotchi will passively restore HP over time, but you can feed them if you want to get back to harvesting sooner…",
      0,
      0
    );
    await api.registry.quest.add.requirement(5, "COMPLETE", "QUEST", 0, 4);
    await api.registry.quest.add.objective(5, "Harvest 1000 $MUSU", "GATHER", "COIN_HAS", 0, 1000);
    await api.registry.quest.add.reward(5, "REVIVE", 1, 5);

    // quest 6
    await api.registry.quest.create(
      6,
      "Farming 3: Accumulating $MUSU",
      "Great, you're really taking this seriously. This one's a long haul. \n\nHope you're getting into a healthy routine with your Kamigotchi now. \n\nIf you haven't already noticed, there's plenty of secrets hidden around the world.",
      0,
      0
    );
    await api.registry.quest.add.requirement(6, "COMPLETE", "QUEST", 0, 5);
    await api.registry.quest.add.objective(6, "Harvest 5000 $MUSU", "GATHER", "COIN_HAS", 0, 5000);
    await api.registry.quest.add.reward(6, "REVIVE", 1, 10);

    // quest 7
    await api.registry.quest.create(
      7,
      "Daily quest: Harvesting",
      "Harvest 200 $MUSU",
      0,
      64800
    );
    await api.registry.quest.add.objective(7, "Harvest 200 $MUSU", "GATHER", "COIN_HAS", 0, 200);
    await api.registry.quest.add.reward(7, "ITEM", 1000, 1); // temp lootbox handler

    // temp lootbox quest for testing
    await api.registry.quest.create(
      8,
      "Lootbox testing",
      "Get a free lootbox!",
      0,
      10
    );
    await api.registry.quest.add.reward(8, "ITEM", 1000, 1); // temp lootbox handler
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
    await api.registry.skill.create(1, 1, 3, "PASSIVE", "Aggression", "+1 Violence per level");
    await api.registry.skill.add.effect(1, "STAT", "VIOLENCE", "INC", 0, 1);

    await api.registry.skill.create(2, 1, 3, "PASSIVE", "Defensiveness", "+1 Harmony per level");
    await api.registry.skill.add.effect(2, "STAT", "HARMONY", "INC", 0, 1);

    await api.registry.skill.create(3, 1, 3, "PASSIVE", "Acquisitiveness", "+1 Power per level");
    await api.registry.skill.add.effect(3, "STAT", "POWER", "INC", 0, 1);

    await api.registry.skill.create(4, 2, 3, "PASSIVE", "Warmonger", "+1 Violence per level");
    await api.registry.skill.add.effect(4, "STAT", "VIOLENCE", "INC", 0, 1);
    await api.registry.skill.add.requirement(4, "SKILL", 1, 3);

    await api.registry.skill.create(5, 2, 3, "PASSIVE", "Protector", "+1 Harmony per level");
    await api.registry.skill.add.effect(5, "STAT", "HARMONY", "INC", 0, 1);
    await api.registry.skill.add.requirement(5, "SKILL", 2, 3);

    await api.registry.skill.create(6, 2, 3, "PASSIVE", "Predator", "+1 Power per level");
    await api.registry.skill.add.effect(6, "STAT", "POWER", "INC", 0, 1);
    await api.registry.skill.add.requirement(6, "SKILL", 3, 3);
  }


  ////////////////////
  // TRAITS

  function csvToMap(arr: any) {
    let jsonObj = [];
    let headers = arr[0];
    for (let i = 1; i < arr.length; i++) {
      let data = arr[i];
      // let obj: {[key: string]: number};
      let mp = new Map();
      for (let j = 0; j < data.length; j++) {
        mp.set(headers[j].trim(), data[j].trim() ? data[j].trim() : "0");
      }
      jsonObj.push(mp);
    }

    return jsonObj;
  }

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

  return {
    init: initAll,
    config: {
      init: () => initConfig(createAdminAPI(systems)),
    },
    items: {
      init: () => initItems(createAdminAPI(systems)),
      initFood: () => initFood(createAdminAPI(systems)),
      initLootbox: () => initLootbox(createAdminAPI(systems)),
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



