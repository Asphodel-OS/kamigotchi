import { utils, BigNumberish } from 'ethers';
import { createPlayerAPI } from './player';
import { setUpWorldAPI } from './world';

export function createAdminAPI(systems: any) {
  async function init() {
    /////////////////
    // CONFIG

    await setConfigString('BASE_URI', 'https://image.asphodel.io/kami/');

    // Leaderboards
    await setConfig('LEADERBOARD_EPOCH', 1);

    // Account Stamina
    await setConfig('ACCOUNT_STAMINA_BASE', 20);
    await setConfig('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

    // Kami Idle Requirement
    await setConfig('KAMI_IDLE_REQ', 180);

    // Kami Mint Price and Limits
    // to be 5, set at 500 for testing
    await setConfig('MINT_ACCOUNT_MAX', 5);
    await setConfig('MINT_INITIAL_MAX', 1111);
    await setConfig('MINT_TOTAL_MAX', 4444);
    await setConfig('MINT_PRICE', utils.parseEther('0.0'));

    // Kami Base Stats
    await setConfig('KAMI_BASE_HEALTH', 50);
    await setConfig('KAMI_BASE_POWER', 10);
    await setConfig('KAMI_BASE_VIOLENCE', 10);
    await setConfig('KAMI_BASE_HARMONY', 10);
    await setConfig('KAMI_BASE_SLOTS', 0);

    // Kami Leveling Curve
    await setConfig('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
    await setConfig('KAMI_LVL_REQ_MULT_BASE', 1259); // compounding increase per level
    await setConfig('KAMI_LVL_REQ_MULT_BASE_PREC', 3); // precision of compounding increase

    // Harvest Rates
    // HarvestRate = power * base * multiplier
    // NOTE: precisions are represented as powers of 10 (e.g. 3 => 10^3 = 1000)
    // so BASE=100 and BASE_PREC=3 means 100/1e3 = 0.1
    await setConfig('HARVEST_RATE_PREC', 9); // ignore this
    await setConfig('HARVEST_RATE_BASE', 250); // in respect to power
    await setConfig('HARVEST_RATE_BASE_PREC', 2); // i.e. x/100
    await setConfig('HARVEST_RATE_MULT_PREC', 4); // should be hardcoded to 2x HARVEST_RATE_MULT_AFF_PREC
    await setConfig('HARVEST_RATE_MULT_AFF_BASE', 100);
    await setConfig('HARVEST_RATE_MULT_AFF_UP', 150);
    await setConfig('HARVEST_RATE_MULT_AFF_DOWN', 50);
    await setConfig('HARVEST_RATE_MULT_AFF_PREC', 2); // 2, not actually used

    // Kami Health Drain/Heal Rates
    // DrainRate = HarvestRate * DrainBaseRate
    // DrainBaseRate = HEALTH_RATE_DRAIN_BASE / 10^HEALTH_RATE_DRAIN_BASE_PREC
    // HealRate = Harmony * HealBaseRate
    // HealBaseRate = HEALTH_RATE_HEAL_BASE / 10^HEALTH_RATE_HEAL_BASE_PREC
    await setConfig('HEALTH_RATE_DRAIN_BASE', 40); // in respect to harvest rate
    await setConfig('HEALTH_RATE_DRAIN_BASE_PREC', 2); // i.e. x/100
    await setConfig('HEALTH_RATE_HEAL_PREC', 9); // ignore this, for consistent math on SC
    await setConfig('HEALTH_RATE_HEAL_BASE', 150); // in respect to harmony
    await setConfig('HEALTH_RATE_HEAL_BASE_PREC', 2); // i.e. x/100


    // Liquidation Calcs
    await setConfig('LIQ_THRESH_BASE', 40);
    await setConfig('LIQ_THRESH_BASE_PREC', 2);
    await setConfig('LIQ_THRESH_MULT_AFF_BASE', 100);
    await setConfig('LIQ_THRESH_MULT_AFF_UP', 200);
    await setConfig('LIQ_THRESH_MULT_AFF_DOWN', 50);
    await setConfig('LIQ_THRESH_MULT_AFF_PREC', 2);

    // Liquidation Bounty
    await setConfig('LIQ_BOUNTY_BASE', 50);
    await setConfig('LIQ_BOUNTY_BASE_PREC', 2);

    /////////////////
    // WORLD

    // create our rooms
    await createRoom(0, 'deadzone', '', [1]); // in case we need this
    await createRoom(
      1,
      'Misty Riverside',
      'You have no memory of arriving here. The air is quiet. The trees grow so thick overhead that it would still be dark at noon.',
      [2]
    );
    await createRoom(
      2,
      'Tunnel of Trees',
      'You see the light at the end of the tunnel; a way out of the forest. Also, you see a blue door made of light. It says “SHOP”.',
      [1, 3, 13]
    );
    await createRoom(
      3,
      'Torii Gate',
      'The end of the road. This gate seems to mark the transition between the misty forest and the massive scrapyard.',
      [2, 4]
    );
    await createRoom(
      4,
      'Vending Machine',
      'Deep in the scrap you find a vending machine well stocked and operating. Behind it you see the power cord is cut off.',
      [3, 5, 12]
    );
    await createRoom(
      5,
      'Restricted Area',
      'A restricted area. Follow the road lined with cherry trees to reach an office complex. Across from the office is another forest.',
      [4, 6, 9]
    );
    await createRoom(
      6,
      'Labs Entrance',
      'This exterior seems designed to resemble a shrine almost as much as it does a corporate office building.',
      [5, 7]
    );
    await createRoom(
      7,
      'Lobby',
      'The lobby decor is sparse, with only one uncomfortable chair. The elevator buttons are broken except for “B” and “PH”.',
      [6, 8, 14]
    );
    await createRoom(
      8,
      'Junk Shop',
      'The electrical room in the basement has been converted into a living space and workshop. Do people live like this?',
      [7]
    );
    await createRoom(
      9,
      'Old Growth',
      'You step into the forest and seem to enter a primordial age. The buzz of giant insects overwhelms your hearing.',
      [5, 10, 11]
    );
    await createRoom(
      10,
      'Insect Node',
      'The buzzing is loudest here. This mound draws insects of all types toward it. They writhe together in a trance.',
      [9]
    );
    await createRoom(
      11,
      'Waterfall Shrine',
      'By the edge of the waterfall basin, a humble shrine grants this place a peaceful aura.',
      [9, 15]
    );
    await createRoom(
      12,
      'Machine Node',
      'A collection of strange and hard to identify objects is buried deep in the scrapyard. It feels dangerous just to be near them.',
      [4]
    );
    await createRoom(
      13,
      'Convenience Store',
      'The glowing blue door transports you inside of a little candy store. Check the glowing “exit” sign to leave.',
      [2]
    );
    await createRoom(
      14,
      "Manager's Office",
      'A slick penthouse office. It seems that this room has been untouched since a magic ritual was performed inside.',
      [7]
    );
    await createRoom(
      15,
      'Temple Cave',
      'A cave behind the waterfall. Friendly statues line a path to the back of the cave away from ancient-looking temple ruins.',
      [11, 16, 18]
    );
    await createRoom(
      16,
      'Techno Temple',
      'Inside the ruined temple. This place might have been traditional once, but now it sparks and rumbles with technology.',
      [15]
    );
    // await createRoom(17, "Misty Park", 'You appear to be outside in an urban park. Balls of light dance around a statue of an angel. Fog hangs thick in the air.', [0]);
    await createRoom(
      18,
      'Cave Crossroads',
      'Deep in the cave the path branches. The bioluminescent fungi make it nearly as bright as day. You can hear bells in the air.',
      [15, 19]
    );
    await createRoom(
      19,
      'Violence Temple',
      'Half eroded stone and mossy growth, half gleaming metal and glowing crystal. Whether temple or technology, it unsettles you.',
      [18]
    );

    // create nodes
    // TODO: save these details in a separate json to be loaded in
    await createNode(
      1,
      'HARVEST',
      3,
      'Torii Gate',
      `These gates usually indicate sacred areas. If you have Kamigotchi, this might be a good place to have them gather $MUSU....`,
      `NORMAL`,
    );

    await createNode(
      2,
      'HARVEST',
      7,
      'Trash Compactor',
      'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.',
      'SCRAP',
    );

    await createNode(
      3,
      'HARVEST',
      10,
      'Termite Mound',
      'A huge termite mound. Apparently, this is sacred to the local insects.',
      'INSECT',
    );

    await createNode(
      4,
      'HARVEST',
      14,
      'Occult Circle',
      'The energy existing here exudes an eeriness that calls out to EERIE Kamigotchi.',
      'EERIE',
    );

    await createNode(
      5,
      'HARVEST',
      12,
      'Monolith',
      'This huge black monolith seems to draw in energy from the rest of the junkyard.',
      'SCRAP',
    );

    // create consumable registry items
    await registerFood(1, 'Maple-Flavor Ghost Gum', 25);
    await registerFood(2, 'Pom-Pom Fruit Candy', 100);
    await registerFood(3, 'Gakki Cookie Sticks', 200);
    await registerRevive(1, 'Red Gakki Ribbon', 10);

    // create our hottie merchant ugajin. names are unique
    await createMerchant(1, 'Mina', 13);

    // init general, TODO: move to worldSetUp
    systems['system._Init'].executeTyped(); // sets the balance of the Kami contract

    setUpWorldAPI(systems).initWorld();

    await initDependents();

    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer'
    );
  }

  // @dev inits txes that depned on the world being set up
  async function initDependents() {
    // Mina
    await setListing(1, 1, 25, 0); // merchant index, item index, buy price, sell price
    await setListing(1, 2, 90, 0);
    await setListing(1, 3, 150, 0);
    await setListing(1, 4, 500, 0);
  }

  /// NOTE: do not use in production
  // @dev give coins for testing
  // @param amount      amount
  async function giveCoins(addy: string, amount: number) {
    return systems['system._devGiveTokens'].executeTyped(addy, amount);
  }

  // @dev admin reveal for pet if blockhash has lapsed. only called by admin
  // @param tokenId     ERC721 tokenId of the pet
  async function petForceReveal(tokenId: number) {
    return systems['system.Pet721.Reveal'].forceReveal(tokenId);
  }

  /////////////////
  //  CONFIG

  async function setConfig(field: string, value: BigNumberish) {
    await sleepIf();
    return systems['system._Config.Set'].executeTyped(field, value);
  }

  // values must be ≤ 32char
  async function setConfigString(field: string, value: string) {
    await sleepIf();
    return systems['system._Config.Set.String'].executeTyped(field, value);
  }

  /////////////////
  //  MERCHANTS

  // creates a merchant with the name at the specified location
  async function createMerchant(index: number, name: string, location: number) {
    await sleepIf();
    return systems['system._Merchant.Create'].executeTyped(index, name, location);
  }

  async function setMerchantLocation(index: number, location: number) {
    await sleepIf();
    return systems['system._Merchant.Set.Location'].executeTyped(index, location);
  }

  async function setMerchantName(index: number, name: string) {
    await sleepIf();
    return systems['system._Merchant.Set.Name'].executeTyped(index, name);
  }

  // sets the prices for the merchant at the specified location
  async function setListing(
    merchantIndex: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    await sleepIf();
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
  async function createNode(
    index: number,
    type: string,
    location: number,
    name: string,
    description: string,
    affinity: string
  ) {
    await sleepIf();
    return systems['system._Node.Create'].executeTyped(
      index,
      type,
      location,
      name,
      description,
      affinity
    );
  }

  async function setNodeAffinity(index: number, affinity: string) {
    await sleepIf();
    return systems['system._Node.Set.Affinity'].executeTyped(index, affinity);
  }

  async function setNodeDescription(index: number, description: string) {
    await sleepIf();
    return systems['system._Node.Set.Description'].executeTyped(index, description);
  }

  async function setNodeLocation(index: number, location: number) {
    await sleepIf();
    return systems['system._Node.Set.Location'].executeTyped(index, location);
  }

  async function setNodeName(index: number, name: string) {
    await sleepIf();
    return systems['system._Node.Set.Name'].executeTyped(index, name);
  }

  /////////////////
  //  ROOMS

  // @dev creates a room with name, location and exits. cannot overwrite room at location
  async function createRoom(location: number, name: string, description: string, exits: number[]) {
    await sleepIf();
    return systems['system._Room.Create'].executeTyped(location, name, description, exits);
  }

  async function setRoomDescription(location: number, description: string) {
    await sleepIf();
    return systems['system._Room.Set.Description'].executeTyped(location, description);
  }

  async function setRoomExits(location: number, exits: number[]) {
    await sleepIf();
    return systems['system._Room.Set.Exits'].executeTyped(location, exits);
  }

  async function setRoomName(location: number, name: string) {
    await sleepIf();
    return systems['system._Room.Set.Name'].executeTyped(location, name);
  }

  /////////////////
  //  REGISTRIES

  // @dev add a food item registry entry
  async function registerFood(foodIndex: number, name: string, health: number) {
    await sleepIf();
    return systems['system._Registry.Food.Create'].executeTyped(foodIndex, name, health);
  }

  // @dev add an equipment item registry entry
  async function registerGear(
    gearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    await sleepIf();
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
  async function registerModification(
    modIndex: number,
    name: string,
    health: number,
    power: number,
    harmony: number,
    violence: number
  ) {
    await sleepIf();
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
  async function registerRevive(reviveIndex: number, name: string, health: number) {
    await sleepIf();
    return systems['system._Registry.Revive.Create'].executeTyped(reviveIndex, name, health);
  }

  // @dev adds a trait in registry
  async function registerTrait(
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
    await sleepIf();
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
  async function updateRegistryFood(foodIndex: number, name: string, health: number) {
    await sleepIf();
    return systems['system._Registry.Food.Update'].executeTyped(foodIndex, name, health);
  }

  // @dev update an equipment item registry entry
  async function updateRegistryGear(
    gearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    await sleepIf();
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
  async function updateRegistryModification(
    modIndex: number,
    name: string,
    health: number,
    power: number,
    harmony: number,
    violence: number
  ) {
    await sleepIf();
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
  async function updateRegistryRevive(reviveIndex: number, name: string, health: number) {
    await sleepIf();
    return systems['system._Registry.Revive.Update'].executeTyped(reviveIndex, name, health);
  }

  //////////////////
  // WAITS

  function sleepIf() {
    if (process.env.MODE == 'OPGOERLI') {
      return new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  return {
    init,
    initDependents,
    giveCoins,
    config: {
      set: {
        raw: setConfig,
        uri: {
          base: (v: string) => setConfigString('BASE_URI', v),
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
                value: (v: number) => setConfig('KAMI_IDLE_REQ', v),
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
        description: setRoomDescription,
        exits: setRoomExits,
        name: setRoomName,
      },
    },
  };
}
