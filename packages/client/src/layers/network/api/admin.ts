import { utils, BigNumberish } from 'ethers';
import { createPlayerAPI } from './player';
import { setUpWorldAPI } from './world';

export function createAdminAPI(systems: any) {
  function init() {
    /////////////////
    // CONFIG

    setConfigString('baseURI', 'https://image.asphodel.io/kami/');

    // Leaderboards
    setConfig('LEADERBOARD_EPOCH', 1);

    // Account Stamina
    setConfig('ACCOUNT_STAMINA_BASE', 20);
    setConfig('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

    // Kami Base Stats
    // to be 5, set at 500 for testing
    setConfig('MINT_MAX', 500);
    setConfig('MINT_PRICE', utils.parseEther('0.015'));

    // set global config fields for Kami Stats
    setConfig('KAMI_BASE_HEALTH', 50);
    setConfig('KAMI_BASE_POWER', 10);
    setConfig('KAMI_BASE_VIOLENCE', 10);
    setConfig('KAMI_BASE_HARMONY', 10);
    setConfig('KAMI_BASE_SLOTS', 0);

    // Harvest Rates
    // HarvestRate = power * base * multiplier
    // NOTE: any precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
    setConfig('HARVEST_RATE_PREC', 9); // ignore this
    setConfig('HARVEST_RATE_BASE', 100); // in respect to power
    setConfig('HARVEST_RATE_BASE_PREC', 3); // i.e. x/1000
    setConfig('HARVEST_RATE_MULT_PREC', 4); // should be hardcoded to 2x HARVEST_RATE_MULT_AFF_PREC
    setConfig('HARVEST_RATE_MULT_AFF_BASE', 100);
    setConfig('HARVEST_RATE_MULT_AFF_UP', 150);
    setConfig('HARVEST_RATE_MULT_AFF_DOWN', 50);
    setConfig('HARVEST_RATE_MULT_AFF_PREC', 2); // 2, not actually used

    // Kami Health Drain/Heal Rates
    // DrainRate = HarvestRate * DrainBaseRate
    // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HealBaseRate
    // HealBaseRate = HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    setConfig('HEALTH_RATE_DRAIN_BASE', 5000); // in respect to harvest rate
    setConfig('HEALTH_RATE_DRAIN_BASE_PREC', 3); // i.e. x/1000
    setConfig('HEALTH_RATE_HEAL_PREC', 9); // ignore this, for consistent math on SC
    setConfig('HEALTH_RATE_HEAL_BASE', 100); // in respect to harmony
    setConfig('HEALTH_RATE_HEAL_BASE_PREC', 3); // i.e. x/1000

    // Liquidation Idle Requirements
    setConfig('LIQ_IDLE_REQ', 300);

    // Liquidation Calcs
    setConfig('LIQ_THRESH_BASE', 20);
    setConfig('LIQ_THRESH_BASE_PREC', 2);
    setConfig('LIQ_THRESH_MULT_AFF_BASE', 100);
    setConfig('LIQ_THRESH_MULT_AFF_UP', 200);
    setConfig('LIQ_THRESH_MULT_AFF_DOWN', 50);
    setConfig('LIQ_THRESH_MULT_AFF_PREC', 2);

    // Liquidation Bounty
    setConfig('LIQ_BOUNTY_BASE', 50);
    setConfig('LIQ_BOUNTY_BASE_PREC', 2);

    /////////////////
    // WORLD

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
    createRoom('Waterfall Shrine', 11, [9, 15]);
    createRoom('Machine Node', 12, [4]);
    createRoom('Convenience Store', 13, [2]);
    createRoom("Manager's Office", 14, [7]);
    createRoom('Temple Cave', 15, [11, 16, 18]);
    createRoom('Techno Temple', 16, [15]);
    // createRoom("Misty Park", 17, [0]);
    createRoom('Cave Crossroads', 18, [15]);

    // create nodes
    // TODO: save these details in a separate json to be loaded in
    createNode(
      1,
      'HARVEST',
      3,
      'Torii Gate',
      `These gates usually indicate sacred areas. If you have Kamigotchi, this might be a good place to have them gather $KAMI....`,
      `NORMAL`,
    );

    createNode(
      2,
      'HARVEST',
      7,
      'Trash Compactor',
      'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.',
      'SCRAP',
    );

    createNode(
      3,
      'HARVEST',
      10,
      'Termite Mound',
      'A huge termite mound. Apparently, this is sacred to the local insects.',
      'INSECT',
    );

    createNode(
      4,
      'HARVEST',
      14,
      'Occult Circle',
      'The energy invested here calls out to EERIE Kamigotchi.',
      'EERIE',
    );

    createNode(
      5,
      'HARVEST',
      12,
      'Monolith',
      'This huge black monolith seems to draw in energy from the rest of the junkyard.',
      'SCRAP',
    );

    // create consumable registry items
    registerFood(1, 'Maple-Flavor Ghost Gum', 25);
    registerFood(2, 'Pom-Pom Fruit Candy', 100);
    registerFood(3, 'Gakki Cookie Sticks', 200);
    registerRevive(1, 'Red Gakki Ribbon', 10);

    // create our hottie merchant ugajin. names are unique
    createMerchant(1, 'Mina', 13);

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
    // Mina
    setListing(1, 1, 25, 0); // merchant index, item index, buy price, sell price
    setListing(1, 2, 90, 0);
    setListing(1, 3, 150, 0);
    setListing(1, 4, 500, 0);
  }

  /// NOTE: do not use in production
  // @dev give coins for testing
  // @param amount      amount
  function giveCoins(addy: string, amount: number) {
    return systems['system._devGiveTokens'].executeTyped(addy, amount);
  }

  // @dev admin reveal for pet if blockhash has lapsed. only called by admin
  // @param tokenId     ERC721 tokenId of the pet
  function petForceReveal(tokenId: number) {
    return systems['system.ERC721.Reveal'].forceReveal(tokenId);
  }

  /////////////////
  //  CONFIG

  function setConfig(field: string, value: BigNumberish) {
    return systems['system._Config.Set'].executeTyped(field, value);
  }

  // values must be ≤ 32char
  function setConfigString(field: string, value: string) {
    return systems['system._Config.Set.String'].executeTyped(field, value);
  }

  /////////////////
  //  MERCHANTS

  // creates a merchant with the name at the specified location
  function createMerchant(index: number, name: string, location: number) {
    return systems['system._Merchant.Create'].executeTyped(index, name, location);
  }

  function setMerchantLocation(index: number, location: number) {
    return systems['system._Merchant.Set.Location'].executeTyped(index, location);
  }

  function setMerchantName(index: number, name: string) {
    return systems['system._Merchant.Set.Name'].executeTyped(index, name);
  }

  // sets the prices for the merchant at the specified location
  function setListing(
    merchantIndex: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    return systems['system._Listing.Set'].executeTyped(
      merchantIndex,
      itemIndex,
      buyPrice,
      sellPrice
    );
  }

  /////////////////
  //  NODES

  // @dev creates an emission node at the specified location
  // @param index       the human-readable index of the node
  // @param type        type of the node (e.g. HARVEST, HEAL, ARENA)
  // @param location    index of the room location
  // @param name        name of the node
  // @param description description of the node, exposed on the UI
  // @param affinity    affinity of the node [ NORMAL | EERIE | INSECT | SCRAP ]
  function createNode(
    index: number,
    type: string,
    location: number,
    name: string,
    description: string,
    affinity: string
  ) {
    return systems['system._Node.Create'].executeTyped(
      index,
      type,
      location,
      name,
      description,
      affinity
    );
  }

  function setNodeAffinity(index: number, affinity: string) {
    return systems['system._Node.Set.Affinity'].executeTyped(index, affinity);
  }

  function setNodeDescription(index: number, description: string) {
    return systems['system._Node.Set.Description'].executeTyped(index, description);
  }

  function setNodeLocation(index: number, location: number) {
    return systems['system._Node.Set.Location'].executeTyped(index, location);
  }

  function setNodeName(index: number, name: string) {
    return systems['system._Node.Set.Name'].executeTyped(index, name);
  }

  /////////////////
  //  ROOMS

  // @dev creates a room with name, location and exits. cannot overwrite room at location
  function createRoom(name: string, location: number, exits: number[]) {
    return systems['system._Room.Create'].executeTyped(name, location, exits);
  }

  function setRoomExits(location: string, exits: number[]) {
    return systems['system._Room.Set.Exits'].executeTyped(location, exits);
  }

  function setRoomName(location: string, name: string) {
    return systems['system._Room.Set.Name'].executeTyped(location, name);
  }

  /////////////////
  //  REGISTRIES

  // @dev add a food item registry entry
  function registerFood(foodIndex: number, name: string, health: number) {
    return systems['system._Registry.Food.Create'].executeTyped(foodIndex, name, health);
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
    return systems['system._Registry.Revive.Create'].executeTyped(reviveIndex, name, health);
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
    return systems['system._Registry.Food.Update'].executeTyped(foodIndex, name, health);
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
    return systems['system._Registry.Revive.Update'].executeTyped(reviveIndex, name, health);
  }

  return {
    init,
    initDependents,
    giveCoins,
    config: {
      set: {
        raw: setConfig,
        uri: {
          base: (v: string) => setConfigString('baseURI', v),
        },
        leaderboard: {
          epoch: (v: number) => setConfig('LEADERBOARD_EPOCH', v),
        },
        account: {
          stamina: {
            base: (v: number) => setConfig('ACCOUNT_STAMINA_BASE', v),
            recoveryPeriod: (v: number) => setConfig('ACCOUNT_STAMINA_RECOVERY_PERIOD', v),
          },
        },
        kami: {
          stats: {
            harmony: (v: number) => setConfig('KAMI_BASE_HARMONY', v),
            health: (v: number) => setConfig('KAMI_BASE_HEALTH', v),
            power: (v: number) => setConfig('KAMI_BASE_POWER', v),
            violence: (v: number) => setConfig('KAMI_BASE_VIOLENCE', v),
            slots: (v: number) => setConfig('KAMI_BASE_SLOTS', v),
          },
          harvest: {
            // precision: (v: number) => setConfig('HARVEST_RATE_PREC', v),  // disabled, no reason to touch (could cause problems)
            rate: {
              base: {
                value: (v: number) => setConfig('HARVEST_RATE_BASE', v),
                precision: (v: number) => setConfig('HARVEST_RATE_BASE_PREC', v),
              },
              multiplier: {
                // precision: (v: number) => setConfig('HARVEST_RATE_MULT_PREC', v),  // disabled, no reason to touch
                affinity: {
                  up: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_UP', v),
                  down: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_DOWN', v),
                  precision: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_PREC', v),
                },
              },
            },
            liquidation: {
              threshold: {
                base: {
                  value: (v: number) => setConfig('LIQ_THRESH_BASE', v),
                  precision: (v: number) => setConfig('LIQ_THRESH_BASE_PREC', v),
                },
                multiplier: {
                  affinity: {
                    base: (v: number) => setConfig('LIQ_THRESH_MULT_AFF_BASE', v),
                    up: (v: number) => setConfig('LIQ_THRESH_MULT_AFF_UP', v),
                    down: (v: number) => setConfig('LIQ_THRESH_MULT_AFF_DOWN', v),
                    precision: (v: number) => setConfig('LIQ_THRESH_MULT_AFF_PREC', v),
                  },
                },
              },
              bounty: {
                base: {
                  value: (v: number) => setConfig('LIQ_BOUNTY_BASE', v),
                  precision: (v: number) => setConfig('LIQ_BOUNTY_BASE_PREC', v),
                },
              },
              idleRequirement: {
                value: (v: number) => setConfig('LIQ_IDLE_REQ', v),
              },
            },
          },
          health: {
            drainRate: {
              base: {
                value: (v: number) => setConfig('HEALTH_RATE_DRAIN_BASE', v),
                precision: (v: number) => setConfig('HEALTH_RATE_DRAIN_BASE_PREC', v),
              },
            },
            healRate: {
              // precision: (v: number) => setConfig('HEALTH_RATE_HEAL_PREC', v),  // disabled, no reason to touch
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
    merchant: {
      create: createMerchant,
      set: {
        location: setMerchantLocation,
        name: setMerchantName,
      },
    },
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
      },
    },
    room: {
      create: createRoom,
      set: {
        exits: setRoomExits,
        name: setRoomName,
      },
    },
  };
}
