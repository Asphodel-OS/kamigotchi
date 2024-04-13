import { utils } from 'ethers';

import droptablesCSV from 'assets/data/items/droptables.csv';
import itemsCSV from 'assets/data/items/items.csv';
import nodesCSV from 'assets/data/nodes/nodes.csv';
import questCSV from 'assets/data/quests/quests.csv';
import roomsCSV from 'assets/data/rooms/rooms.csv';
import backgroundCSV from 'assets/data/traits/backgrounds.csv';
import bodyCSV from 'assets/data/traits/bodies.csv';
import colorCSV from 'assets/data/traits/colors.csv';
import faceCSV from 'assets/data/traits/faces.csv';
import handCSV from 'assets/data/traits/hands.csv';

import { parseToLogicType } from 'layers/network/shapes/Quest';
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

    const mode = import.meta.env.MODE;
    if (!mode || mode === 'development') {
      await initLocalConfig();
      await initGachaPool(333);
      await initLocalQuests();
    } else {
      await initGachaPool(333);
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
    await api.config.set.number('BASE_FRIENDS_LIMIT', 10);
    await api.config.set.number('FRIENDS_REQUEST_LIMIT', 10);

    // Kami Idle Requirement
    await api.config.set.number('KAMI_IDLE_REQ', 180);

    // Kami Mint Price and Limits
    // to be 5, set at 500 for testing
    await api.config.set.number('MINT_ACCOUNT_MAX', 5);
    await api.config.set.number('MINT_INITIAL_MAX', 1111);
    await api.config.set.number('MINT_TOTAL_MAX', 4444);
    await api.config.set.number('MINT_PRICE', utils.parseEther('0.0'));
    await api.config.set.number('GACHA_REROLL_PRICE', utils.parseEther('0.0001'));

    // Kami Base Stats
    await api.config.set.number('KAMI_BASE_HEALTH', 50);
    await api.config.set.number('KAMI_BASE_POWER', 10);
    await api.config.set.number('KAMI_BASE_VIOLENCE', 10);
    await api.config.set.number('KAMI_BASE_HARMONY', 10);
    await api.config.set.number('KAMI_BASE_SLOTS', 0);

    // Kami Leveling Curve
    await api.config.set.number('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
    await api.config.set.array('KAMI_LVL_REQ_MULT_BASE', [1259, 3]);

    // Harvest Rates
    // HarvestRate = power * base * multiplier
    // NOTE: precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
    // [prec, base, base_prec, mult_prec]
    await api.config.set.array('HARVEST_RATE', [9, 250, 2, 7]);
    // [base, up, down]
    await api.config.set.array('HARVEST_RATE_MULT_AFF', [100, 150, 50]);
    await api.config.set.number('HARVEST_RATE_MULT_AFF_PREC', 2); // 2, not actually used

    // Kami Health Drain/Heal Rates
    // DrainRate = HarvestRate * DrainBaseRate
    // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HealBaseRate
    // HealBaseRate = HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    await api.config.set.array('HEALTH_RATE_DRAIN_BASE', [20, 2]);
    // (prec, base, base_prec)
    await api.config.set.array('HEALTH_RATE_HEAL_BASE', [9, 120, 2]);

    // Liquidation Calcs
    await api.config.set.array('LIQ_THRESH_BASE', [40, 2]);
    // [base, up, down]
    await api.config.set.array('LIQ_THRESH_MULT_AFF', [100, 200, 50]);
    await api.config.set.number('LIQ_THRESH_MULT_AFF_PREC', 2);

    // Liquidation Bounty
    await api.config.set.array('LIQ_BOUNTY_BASE', [50, 2]);
  }

  // local config settings for faster testing
  async function initLocalConfig() {
    await api.config.set.number('MINT_ACCOUNT_MAX', 50000000);
    await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 10);
    await api.config.set.number('KAMI_IDLE_REQ', 10);
    await api.config.set.number('KAMI_LVL_REQ_BASE', 5); // experience required for level 1->2
    await api.config.set.array('HARVEST_RATE', [9, 10000, 2, 7]); // in respect to power
    await api.config.set.array('HEALTH_RATE_HEAL_BASE', [9, 10000, 2]); // in respect to harmony
  }

  ////////////////////
  // ROOMS

  async function initRoom(roomIndex: number) {
    const room = roomsCSV.find((r: any) => Number(r['Index']) === roomIndex);
    if (!room) return;

    await api.room.create(
      {
        x: Number(room['X']),
        y: Number(room['Y']),
        z: Number(room['Z']),
      },
      Number(room['Index']),
      room['Name'],
      room['Description'],
      room['Exits'].split(',').map((n: string) => Number(n.trim()))
    );
  }

  async function initRooms() {
    for (let i = 0; i < roomsCSV.length; i++) {
      const room = roomsCSV[i];
      if (room['Enabled'] === 'true') {
        // console.log(room);
        await sleepIf();
        await api.room.create(
          {
            x: Number(room['X']),
            y: Number(room['Y']),
            z: Number(room['Z']),
          },
          Number(room['Index']),
          room['Name'],
          room['Description'],
          room['Exits'].split(',').map((n: string) => Number(n.trim()))
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
    // console.log(roomsCSV);
    // console.log(itemsCSV);
    for (let i = 0; i < itemsCSV.length; i++) {
      await sleepIf();
      const item = itemsCSV[i];
      const type = item['Type'].toUpperCase();
      // console.log(itemsCSV[i]);
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
    await api.registry.item.create.lootbox(
      Number(item['Index']),
      item['Name'],
      item['Description'],
      [1, 2, 3],
      [9, 9, 7],
      item['MediaURI']
    );
    return; // using placeholder lootboxes for now. similar challenges in representation to rooms
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
    for (let i = 0; i < questCSV.length; i++) {
      const quest = questCSV[i];
      await sleepIf();
      try {
        if (quest['Status'] !== 'For Implementation') continue;
        if (quest['Class'] === 'Quest' || quest['Class'] === '') await initQuest(quest);
        else if (quest['Class'] === 'Requirement') await initQuestRequirement(quest);
        else if (quest['Class'] === 'Objective') await initQuestObjective(quest);
        else if (quest['Class'] === 'Reward') await initQuestReward(quest);
      } catch {}
    }
  }

  async function initLocalQuests() {
    api.registry.quest.create(
      1000000,
      'The Chosen Taruchi',
      'Hey there! You look like someone with good taste. Ever heard of a Kamigotchi? \n You need one to play the game - here, take 5!',
      'Was it really worth it?',
      0,
      0
    );
    api.registry.quest.add.reward(1000000, 'MINT20', 0, 111);
  }

  async function initQuest(entry: any) {
    // console.log('initQuest', entry['Index']);
    await api.registry.quest.create(
      Number(entry['Index']),
      entry['Title'],
      entry['Introduction text'],
      entry['Resolution text'],
      Number(entry['QP'] ?? 0),
      entry['Daily'] === 'Yes' ? 64800 : 0
    );
  }

  async function initQuestRequirement(entry: any) {
    // console.log('req', entry['Index']);
    await api.registry.quest.add.requirement(
      Number(entry['Index']),
      parseToLogicType(entry['Operator']),
      entry['SubType'],
      Number(entry['IndexFor'] ?? 0),
      Number(entry['ValueFor'] ?? 0)
    );
  }

  async function initQuestObjective(entry: any) {
    // console.log('obj', entry['Index']);
    await api.registry.quest.add.objective(
      Number(entry['Index']),
      entry['ConditionDescription'],
      entry['DeltaType'] + '_' + entry['Operator'],
      entry['SubType'],
      Number(entry['IndexFor'] ?? 0),
      Number(entry['ValueFor'] ?? 0)
    );
  }

  async function initQuestReward(entry: any) {
    // console.log('reward', entry['Index']);
    await api.registry.quest.add.reward(
      Number(entry['Index']),
      entry['SubType'],
      Number(entry['IndexFor'] ?? 0),
      Number(entry['ValueFor'] ?? 0)
    );
  }

  async function initQuestByIndex(indices: number[]) {
    for (let i = 0; i < questCSV.length; i++) {
      const quest = questCSV[i];
      if (!indices.includes(Number(quest['Index']))) continue;
      await sleepIf();
      try {
        if (quest['Status'] !== 'For Implementation') continue;
        if (quest['Class'] === 'Quest' || quest['Class'] === '') await initQuest(quest);
        else if (quest['Class'] === 'Requirement') await initQuestRequirement(quest);
        else if (quest['Class'] === 'Objective') await initQuestObjective(quest);
        else if (quest['Class'] === 'Reward') await initQuestReward(quest);
      } catch {}
    }
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
    await api.registry.skill.create(1, 'KAMI', 'PASSIVE', 'Vigor', 1, 3, 'images/skills/vigor.png');
    await api.registry.skill.add.effect(1, 'STAT', 'HEALTH', 10, '+10 Health per level');

    await api.registry.skill.create(
      2,
      'KAMI',
      'PASSIVE',
      'Acquisitiveness',
      1,
      3,

      'images/skills/acquisitiveness.png'
    );
    await api.registry.skill.add.effect(2, 'STAT', 'POWER', 1, '+1 Power per level');

    await api.registry.skill.create(
      3,
      'KAMI',
      'PASSIVE',
      'Aggression',
      1,
      3,
      'images/skills/aggression.png'
    );
    await api.registry.skill.add.effect(3, 'STAT', 'VIOLENCE', 1, '+1 Violence per level');

    await api.registry.skill.create(
      4,
      'KAMI',
      'PASSIVE',
      'Defensiveness',
      1,
      3,
      'images/skills/defensiveness.png'
    );
    await api.registry.skill.add.effect(4, 'STAT', 'HARMONY', 1, '+1 Harmony per level');

    await api.registry.skill.create(
      5,
      'KAMI',
      'PASSIVE',
      'Endurance',
      2,
      3,
      'images/skills/endurance.png'
    );
    await api.registry.skill.add.effect(5, 'STAT', 'HEALTH', 10, '+10 Health per level');
    await api.registry.skill.add.requirement(5, 'SKILL', 1, 3);

    await api.registry.skill.create(
      6,
      'KAMI',
      'PASSIVE',
      'Predator',
      2,
      3,
      'images/skills/predator.png'
    );
    await api.registry.skill.add.effect(6, 'STAT', 'POWER', 1, '+1 Power per level');
    await api.registry.skill.add.requirement(6, 'SKILL', 2, 3);

    await api.registry.skill.create(
      7,
      'KAMI',
      'PASSIVE',
      'Warmonger',
      2,
      3,
      'images/skills/warmonger.png'
    );
    await api.registry.skill.add.effect(7, 'STAT', 'VIOLENCE', 1, '+1 Violence per level');
    await api.registry.skill.add.requirement(7, 'SKILL', 3, 3);

    await api.registry.skill.create(
      8,
      'KAMI',
      'PASSIVE',
      'Protector',
      2,
      3,
      'images/skills/protector.png'
    );
    await api.registry.skill.add.effect(8, 'STAT', 'HARMONY', 1, '+1 Harmony per level');
    await api.registry.skill.add.requirement(8, 'SKILL', 4, 3);

    // (Health) Skill Tree
    await api.registry.skill.create(
      110,
      'KAMI',
      'PASSIVE',
      'Workout Routine',
      1,
      3,
      'images/skills/workout-routine.png'
    );
    await api.registry.skill.add.effect(
      110,
      'HARVEST',
      'DRAIN',
      -50,
      '-5% Harvest Drain per level'
    );
    await api.registry.skill.add.requirement(110, 'SKILL', 1, 3);

    // (Power) Skill Tree
    await api.registry.skill.create(
      201,
      'KAMI',
      'PASSIVE',
      'Greed',
      1,
      3,
      'images/skills/greed.png'
    );
    await api.registry.skill.add.effect(
      201,
      'HARVEST',
      'OUTPUT',
      50,
      '+5% Harvest Output per level'
    );
    await api.registry.skill.add.requirement(201, 'SKILL', 2, 3);

    await api.registry.skill.create(
      202,
      'KAMI',
      'PASSIVE',
      'Leverage',
      2,
      3,
      'images/skills/leverage.png'
    );
    await api.registry.skill.add.effect(
      202,
      'HARVEST',
      'OUTPUT',
      75,
      '+7.5% Harvest Output per level'
    );
    await api.registry.skill.add.requirement(202, 'SKILL', 201, 3);

    await api.registry.skill.create(
      203,
      'KAMI',
      'PASSIVE',
      'Looping',
      3,
      3,
      'images/skills/looping.png'
    );
    await api.registry.skill.add.effect(
      203,
      'HARVEST',
      'OUTPUT',
      100,
      '+10% Harvest Output per level'
    );
    await api.registry.skill.add.requirement(203, 'SKILL', 202, 3);

    await api.registry.skill.create(
      204,
      'KAMI',
      'PASSIVE',
      'Degenerate',
      3,
      3,
      'images/skills/degenerate.png'
    );
    await api.registry.skill.add.effect(
      204,
      'HARVEST',
      'OUTPUT',
      125,
      '+12.5% Harvest Output per level'
    );
    await api.registry.skill.add.requirement(204, 'SKILL', 203, 3);

    await api.registry.skill.create(
      210,
      'KAMI',
      'PASSIVE',
      'Sunglasses Ownership',
      1,
      3,
      'images/skills/sunglasses-ownership.png'
    );
    await api.registry.skill.add.effect(
      210,
      'HARVEST',
      'DRAIN',
      -50,
      '-5% Harvest Drain per level'
    );
    await api.registry.skill.add.requirement(210, 'SKILL', 2, 3);

    await api.registry.skill.create(
      220,
      'KAMI',
      'PASSIVE',
      'Bandit',
      1,
      3,
      'images/skills/bandit.png'
    );
    await api.registry.skill.add.effect(
      220,
      'HARVEST',
      'COOLDOWN',
      20,
      '-20s Harvest Cooldown per level'
    );
    await api.registry.skill.add.requirement(220, 'SKILL', 2, 3);

    // (Violence) Skill Tree
    await api.registry.skill.create(
      320,
      'KAMI',
      'PASSIVE',
      'Sniper',
      1,
      3,
      'images/skills/sniper.png'
    );
    await api.registry.skill.add.effect(
      320,
      'ATTACK',
      'COOLDOWN',
      20,
      '-20s Attack Cooldown per level'
    );
    await api.registry.skill.add.requirement(320, 'SKILL', 3, 3);

    // (Harmony) Skill Tree
    await api.registry.skill.create(
      401,
      'KAMI',
      'PASSIVE',
      'Patience',
      1,
      3,
      'images/skills/patience.png'
    );
    await api.registry.skill.add.effect(
      401,
      'HARVEST',
      'DRAIN',
      -50,
      '-5% Harvest Drain per level'
    );
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
      initByIndex: (indices: number[]) => initQuestByIndex(indices),
      delete: (indices: number[]) => deleteQuests(indices),
    },
    relationships: {
      init: () => initRelationships(),
      delete: (npcs: number[], indices: number[]) => deleteRelationships(indices, npcs),
    },
    rooms: {
      init: () => initRooms(),
      initByIndex: (i: number) => initRoom(i),
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
      return new Promise((resolve) => setTimeout(resolve, 4000));
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
