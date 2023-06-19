import { createAdminAPI } from './admin';
import background from 'assets/data/kami/Background.csv';
import body from 'assets/data/kami/Body.csv';
import color from 'assets/data/kami/Color.csv';
import face from 'assets/data/kami/Face.csv';
import hand from 'assets/data/kami/Hand.csv';

import { AdminAPI } from './admin';
import { async } from 'rxjs';


// TODO: move this to a utils file
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

export function setUpWorldAPI(adminAPI: AdminAPI) {
  function initWorld() {
    adminAPI.init();
    setConfig();
    registerTraits();
    registerItems();
    createRooms();
    createMerchants();
    createNodes();
  }

  async function createMerchants() {
    adminAPI.merchant.create(1, 'Mina', 13);
    adminAPI.listing.set(1, 1, 25, 0);  // Maple-Flavor Ghost Gum
    adminAPI.listing.set(1, 2, 90, 0);  // Pom-Pom Fruit Candy
    adminAPI.listing.set(1, 3, 150, 0); // Gakki Cookie Sticks
    adminAPI.listing.set(1, 4, 500, 0); // Red Gakki Ribbon
  }

  // TODO: load this data into json files
  async function createNodes() {
    let name = '';
    let description = '';

    name = 'Torii Gate';
    description = 'These gates usually indicate sacred areas. If you have Kamigotchi, this might be a good place to have them gather $KAMI....';
    adminAPI.node.create(1, 'HARVEST', 3, name, description, 'NORMAL');

    name = 'Trash Compactor';
    description = 'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.';
    adminAPI.node.create(2, 'HARVEST', 7, name, description, 'SCRAP');

    name = 'Termite Mound';
    description = 'A huge termite mound. Apparently, this is sacred to the local insects.';
    adminAPI.node.create(3, 'HARVEST', 10, name, description, 'INSECT');

    name = 'Occult Circle';
    description = 'The energy invested here calls out to EERIE Kamigotchi.';
    adminAPI.node.create(4, 'HARVEST', 14, name, description, 'EERIE');

    name = 'Monolith';
    description = 'This huge black monolith seems to draw in energy from the rest of the junkyard.';
    adminAPI.node.create(5, 'HARVEST', 12, name, description, 'SCRAP');
  }

  async function createRooms() {
    adminAPI.room.create('deadzone', 0, [1]); // in case we need this
    adminAPI.room.create('Misty Riverside', 1, [2]);
    adminAPI.room.create('Tunnel of Trees', 2, [1, 3, 13]);
    adminAPI.room.create('Torii Gate', 3, [2, 4]);
    adminAPI.room.create('Vending Machine', 4, [3, 5, 12]);
    adminAPI.room.create('Restricted Area', 5, [4, 6, 9]);
    adminAPI.room.create('Labs Entrance', 6, [5, 7]);
    adminAPI.room.create('Lobby', 7, [6, 8, 14]);
    adminAPI.room.create('Junk Shop', 8, [7]);
    adminAPI.room.create('Forest: Old Growth', 9, [5, 10, 11]);
    adminAPI.room.create('Forest: Insect Node', 10, [9]);
    adminAPI.room.create('Waterfall Shrine', 11, [9, 15]);
    adminAPI.room.create('Machine Node', 12, [4]);
    adminAPI.room.create('Convenience Store', 13, [2]);
    adminAPI.room.create("Manager's Office", 14, [7]);
    adminAPI.room.create('Temple Cave', 15, [11, 16, 18]);
    adminAPI.room.create('Techno Temple', 16, [15]);
    // adminAPI.room.create("Misty Park", 17, [0]);
    adminAPI.room.create('Cave Crossroads', 18, [15]);
  }


  async function registerItems() {
    // food
    adminAPI.registry.food.create(1, 'Maple-Flavor Ghost Gum', 25);
    adminAPI.registry.food.create(2, 'Pom-Pom Fruit Candy', 100);
    adminAPI.registry.food.create(3, 'Gakki Cookie Sticks', 200);

    // revives
    adminAPI.registry.revive.create(1, 'Red Gakki Ribbon', 10);
  }

  async function registerTraits() {
    // inits a single type of trait, returns number of traits
    function processTraitSheet(dataRaw: any, type: string) {
      const data = csvToMap(dataRaw);
      for (let i = 0; i < data.length; i++) {
        adminAPI.registry.trait.create(
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

    processTraitSheet(background, "BACKGROUND");
    processTraitSheet(body, "BODY");
    processTraitSheet(color, "COLOR");
    processTraitSheet(face, "FACE");
    processTraitSheet(hand, "HAND");
  }

  async function setConfig() {
    // Base URI string
    adminAPI.config.set.uri.base('https://kami-image.asphodel.io/image/');

    // Account Stamina
    adminAPI.config.set.account.stamina.base(20);
    adminAPI.config.set.account.stamina.recoveryPeriod(300);

    // Kami Mint
    adminAPI.config.set.kami.mint.limit(500); // 500 for testing, 5 for live
    adminAPI.config.set.kami.mint.price(0.015);

    // Kami Base Stats
    adminAPI.config.set.kami.stats.health(50);
    adminAPI.config.set.kami.stats.power(10);
    adminAPI.config.set.kami.stats.violence(10);
    adminAPI.config.set.kami.stats.harmony(10);
    adminAPI.config.set.kami.stats.slots(0);

    // Kami Harvest Rates Base
    // HarvestRate = power * base * multiplier
    // NOTE: any precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
    adminAPI.config.set.raw('HARVEST_RATE_PREC', 9);
    adminAPI.config.set.kami.harvest.rate.base.precision(3);
    adminAPI.config.set.kami.harvest.rate.base.value(100);

    // Kami Harvest Rates Affinity Multiplier
    adminAPI.config.set.raw('HARVEST_RATE_MULT_PREC', 4);
    adminAPI.config.set.kami.harvest.rate.multiplier.affinity.precision(2);
    adminAPI.config.set.kami.harvest.rate.multiplier.affinity.base(100);
    adminAPI.config.set.kami.harvest.rate.multiplier.affinity.up(150);
    adminAPI.config.set.kami.harvest.rate.multiplier.affinity.down(50);

    // Kami Health Drain/Heal Rates
    // DrainRate = HarvestRate * DrainBaseRate
    // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HealBaseRate
    // HealBaseRate = HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    adminAPI.config.set.raw('HEALTH_RATE_HEAL_PREC', 9);
    adminAPI.config.set.kami.health.healRate.base.precision(3);
    adminAPI.config.set.kami.health.healRate.base.value(100);
    adminAPI.config.set.kami.health.drainRate.base.precision(3);
    adminAPI.config.set.kami.health.drainRate.base.value(5000);

    // Kami Liquidation Requirements
    adminAPI.config.set.kami.harvest.liquidation.idleRequirement.value(300);

    // Kami Liquidation Thresholds Base
    adminAPI.config.set.kami.harvest.liquidation.threshold.base.value(20);
    adminAPI.config.set.kami.harvest.liquidation.threshold.base.precision(2);

    // Kami Liquidation Thresholds Affinity Multiplier
    adminAPI.config.set.kami.harvest.liquidation.threshold.multiplier.affinity.precision(2);
    adminAPI.config.set.kami.harvest.liquidation.threshold.multiplier.affinity.base(100);
    adminAPI.config.set.kami.harvest.liquidation.threshold.multiplier.affinity.up(200);
    adminAPI.config.set.kami.harvest.liquidation.threshold.multiplier.affinity.down(50);

    // Kami Liquidation Bounties
    adminAPI.config.set.kami.harvest.liquidation.bounty.base.value(50);
    adminAPI.config.set.kami.harvest.liquidation.bounty.base.precision(2);

  }


  return {
    initWorld,
  }
}



