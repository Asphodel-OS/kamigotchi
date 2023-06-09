import { createPlayerAPI } from './player';
import { setUpWorldAPI } from './world';

export function createAdminAPI(systems: any) {
  function init() {
    // this doesnt work without the https:// so it's unused atm
    setConfigString('baseURI', 'kami-image.asphodel.io/image/');

    // set global config fields for Kami Stats
    setConfig('KAMI_BASE_HEALTH', 50);
    setConfig('KAMI_BASE_POWER', 10);
    setConfig('KAMI_BASE_VIOLENCE', 10);
    setConfig('KAMI_BASE_HARMONY', 10);
    setConfig('KAMI_BASE_SLOTS', 0);

    // Harvest Rates (just ignore root precision)
    // dHarvest/dt = base * power * multiplier
    // NOTE: any precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE of 100 and BASE_PREC of 3 means 100/1e3 = 0.1
    const numHarvestTraits = 3; // don't change this, some uncoded fuckery atm
    const affinityPrecision = 2;
    const multiplierPrecision = numHarvestTraits * affinityPrecision;
    setConfig('HARVEST_RATE_PREC', 6);   // never need to change this one
    setConfig('HARVEST_RATE_BASE', 100);
    setConfig('HARVEST_RATE_BASE_PREC', 3);
    setConfig('HARVEST_RATE_MULT_PREC', multiplierPrecision);
    setConfig('HARVEST_RATE_MULT_AFF_BASE', 100);
    setConfig('HARVEST_RATE_MULT_AFF_UP', 150);
    setConfig('HARVEST_RATE_MULT_AFF_DOWN', 50);
    setConfig('HARVEST_RATE_MULT_AFF_PREC', affinityPrecision); // 2, not actually used

    // health drain and heal rates (just ignore root precisions)
    // DrainRate = HarvestRate * HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    setConfig('HEALTH_RATE_DRAIN_BASE', 5000); // in respect to harvest rate
    setConfig('HEALTH_RATE_DRAIN_BASE_PREC', 3);
    setConfig('HEALTH_RATE_HEAL_PREC', 6);
    setConfig('HEALTH_RATE_HEAL_BASE', 100);   // in respect to harmony
    setConfig('HEALTH_RATE_HEAL_BASE_PREC', 3);

    // create our rooms
    createRoom('deadzone', 0, [1]); // in case we need this
    createRoom('Misty Riverside', 1, [2]);
    createRoom('Tunnel of Trees', 2, [1, 3, 13]);
    createRoom('Torii Gate', 3, [2, 4]);
    createRoom('Vending Machine', 4, [3, 5, 12]);
    createRoom('Restricted Area', 5, [4, 6, 9]);
    createRoom('Labs Entrance', 6, [5, 7]);
    createRoom('Lobby', 7, [6, 8, 14]);
    createRoom('Junk Shop', 8, [7]);
    createRoom('Forest: Old Growth', 9, [5, 10, 11]);
    createRoom('Forest: Insect Node', 10, [9]);
    createRoom('Waterfall Shrine', 11, [9]);
    createRoom('Machine Node', 12, [4]);
    createRoom('Convenience Store', 13, [2]);
    createRoom("Manager's Office", 14, [7]);

    // create nodes
    // TODO: save these details in a separate json to be loaded in
    createNode(
      'Torii Gate',
      3,
      'HARVEST',
      `These gates usually indicate sacred areas. If you have Kamigotchi, this might be a good place to have them gather $KAMI....`
    );

    createNode(
      'Trash Compactor',
      7,
      'HARVEST',
      'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.'
    );

    createNode(
      'Termite Mound',
      10,
      'HARVEST',
      'A huge termite mound. Apparently, this is sacred to the local insects.'
    );

    createNode(
      'Occult Circle',
      14,
      'HARVEST',
      'The energy invested here calls out to EERIE Kamigotchi.'
    );

    createNode(
      'Monolith',
      12,
      'HARVEST',
      'This huge black monolith seems to draw in energy from the rest of the junkyard.'
    );

    // create consumable registry items
    registerFood(1, 'Maple-Flavor Ghost Gum', 25);
    registerFood(2, 'Pom-Pom Fruit Candy', 100);
    registerFood(3, 'Gakki Cookie Sticks', 200);
    registerRevive(1, 'Red Gakki Ribbon', 10);

    // create our hottie merchant ugajin. names are unique
    createMerchant('Mina', 13);

    // init general, TODO: move to worldSetUp
    systems['system._Init'].executeTyped(); // sets the balance of the Kami contract

    setUpWorldAPI(systems).initWorld();

    initDependents();

    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer'
    );
  }

  // @dev inits txes that depned on the world being set up
  function initDependents() {
    setNodeAffinity('Torii Gate', 'NORMAL');
    setNodeAffinity('Trash Compactor', 'SCRAP');
    setNodeAffinity('Termite Mound', 'INSECT');
    setNodeAffinity('Occult Circle', 'EERIE');
    setNodeAffinity('Monolith', 'SCRAP');

    setListing('Mina', 1, 25, 0); // merchant, item index, buy price, sell price
    setListing('Mina', 2, 90, 0);
    setListing('Mina', 3, 150, 0);
    setListing('Mina', 4, 500, 0);
  }

  /// TODO: remove system for production
  // @dev give coins for testing
  // @param amount      amount
  function giveCoins(addy: string, amount: number) {
    return systems['system._devGiveTokens'].executeTyped(addy, amount);
  }

  // @dev admin reveal for pet if blockhash has lapsed. only called by admin
  // @param tokenId     ERC721 tokenId of the pet
  function petForceReveal(tokenId: number) {
    return systems['system.ERC721.metadata'].forceReveal(tokenId);
  }

  // @dev creates a room with name, location and exits. cannot overwrite room at location
  function createRoom(name: string, location: number, exits: number[]) {
    return systems['system._Room.Create'].executeTyped(name, location, exits);
  }

  /////////////////
  //  CONFIG

  function setConfig(field: string, value: number) {
    return systems['system._Config.Set'].executeTyped(field, value);
  }

  // values must be ≤ 32char
  function setConfigString(field: string, value: string) {
    return systems['system._Config.Set.String'].executeTyped(field, value);
  }

  /////////////////
  //  MERCHANTS

  // creates a merchant with the name at the specified location
  function createMerchant(name: string, location: number) {
    return systems['system._Merchant.Create'].executeTyped(name, location);
  }

  // sets the prices for the merchant at the specified location
  function setListing(
    name: string,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    return systems['system._Listing.Set'].executeTyped(
      name,
      itemIndex,
      buyPrice,
      sellPrice
    );
  }

  /////////////////
  //  NODES

  // @dev creates an emission node at the specified location
  // @param name      name of the node
  // @param location  index of the room location
  // @param type      type of the node (e.g. HARVEST, HEAL, ARENA)
  // @param desc      description of the node, exposed on the UI
  function createNode(name: string, location: number, type: string, desc: string) {
    return systems['system._Node.Create'].executeTyped(name, location, type, desc);
  }

  function setNodeAffinity(name: string, affinity: string) {
    return systems['system._Node.Set.Affinity'].executeTyped(name, affinity);
  }

  function setNodeDescription(name: string, desc: string) {
    return systems['system._Node.Set.Description'].executeTyped(name, desc);
  }

  function setNodeLocation(name: string, location: number) {
    return systems['system._Node.Set.Location'].executeTyped(name, location);
  }

  function setNodeName(name: string, newName: string) {
    return systems['system._Node.Set.Name'].executeTyped(name, newName);
  }

  /////////////////
  //  REGISTRIES

  // @dev add a food item registry entry
  function registerFood(foodIndex: number, name: string, health: number) {
    return systems['system._Registry.Food.Create'].executeTyped(
      foodIndex,
      name,
      health
    );
  }

  // @dev add an equipment item registry entry
  function registerGear(
    gearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    return systems['system._Registry.Gear.Create'].executeTyped(
      gearIndex,
      name,
      type_,
      health,
      power,
      violence,
      harmony,
      slots
    );
  }

  // @dev add a modification item registry entry
  function registerModification(
    modIndex: number,
    name: string,
    health: number,
    power: number,
    harmony: number,
    violence: number
  ) {
    return systems['system._Registry.Mod.Create'].executeTyped(
      modIndex,
      name,
      health,
      power,
      violence,
      harmony
    );
  }

  // @dev add a revive item registry entry
  function registerRevive(reviveIndex: number, name: string, health: number) {
    return systems['system._Registry.Revive.Create'].executeTyped(
      reviveIndex,
      name,
      health
    );
  }

  // @dev adds a trait in registry
  function registerTrait(
    index: number,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number,
    rarity: number,
    affinity: string,
    name: string,
    type: string
  ) {
    return systems['system._Registry.Trait.Create'].executeTyped(
      index,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity,
      affinity,
      name,
      type
    );
  }

  // @dev update a food item registry entry
  function updateRegistryFood(foodIndex: number, name: string, health: number) {
    return systems['system._Registry.Food.Update'].executeTyped(
      foodIndex,
      name,
      health
    );
  }

  // @dev update an equipment item registry entry
  function updateRegistryGear(
    gearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    return systems['system._Registry.Gear.Update'].executeTyped(
      gearIndex,
      name,
      type_,
      health,
      power,
      violence,
      harmony,
      slots
    );
  }

  // @dev update a modification item registry entry
  function updateRegistryModification(
    modIndex: number,
    name: string,
    health: number,
    power: number,
    harmony: number,
    violence: number
  ) {
    return systems['system._Registry.Mod.Update'].executeTyped(
      modIndex,
      name,
      health,
      power,
      violence,
      harmony
    );
  }

  // @dev update a revive item registry entry
  function updateRegistryRevive(reviveIndex: number, name: string, health: number) {
    return systems['system._Registry.Revive.Update'].executeTyped(
      reviveIndex,
      name,
      health
    );
  }

  return {
    init,
    initDependents,
    giveCoins,
    config: {
      set: {
        kami: {
          baseStats: {
            harmony: (v: number) => setConfig('KAMI_BASE_HARMONY', v),
            health: (v: number) => setConfig('KAMI_BASE_HEALTH', v),
            power: (v: number) => setConfig('KAMI_BASE_POWER', v),
            violence: (v: number) => setConfig('KAMI_BASE_VIOLENCE', v),
            slots: (v: number) => setConfig('KAMI_BASE_SLOTS', v),
          },
          harvestRate: {
            precision: (v: number) => setConfig('HARVEST_RATE_PREC', v),
            base: {
              value: (v: number) => setConfig('HARVEST_RATE_BASE', v),
              precision: (v: number) => setConfig('HARVEST_RATE_BASE_PREC', v),
            },
            multiplier: {
              precision: (v: number) => setConfig('HARVEST_RATE_MULT_PREC', v),
              affinity: {
                up: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_UP', v),
                down: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_DOWN', v),
                precision: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_PREC', v),
              },
            },
          },
          health: {
            drain: {
              base: {
                value: (v: number) => setConfig('HEALTH_RATE_DRAIN_BASE', v),
                precision: (v: number) => setConfig('HEALTH_RATE_DRAIN_BASE_PREC', v),
              },
            },
            heal: {
              precision: (v: number) => setConfig('HEALTH_RATE_HEAL_PREC', v),
              base: {
                value: (v: number) => setConfig('HEALTH_RATE_HEAL_BASE', v),
                precision: (v: number) => setConfig('HEALTH_RATE_HEAL_BASE_PREC', v),
              },
            },
          },
        },
      },
    },
    listing: { set: setListing },
    merchant: { create: createMerchant },
    node: {
      create: createNode,
      set: {
        affinity: setNodeAffinity,
        description: setNodeDescription,
        location: setNodeLocation,
        name: setNodeName,
      },
    },
    pet: { forceReveal: petForceReveal },
    registry: {
      food: {
        create: registerFood,
        update: updateRegistryFood,
      },
      gear: {
        create: registerGear,
        update: updateRegistryGear,
      },
      trait: {
        create: registerTrait,
      },
      modification: {
        create: registerModification,
        update: updateRegistryModification,
      },
      revive: {
        create: registerRevive,
        update: updateRegistryRevive,
      }
    },
    room: { create: createRoom },
  };
}
