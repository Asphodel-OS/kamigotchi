import { utils, BigNumberish } from 'ethers';
import { createPlayerAPI } from './player';
import { setUpWorldAPI } from './world';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

export function createAdminAPI(systems: any) {
  function init() {
    systems['system._Init'].executeTyped(); // sets the balance of the Kami contract

    // ORDER: color, background, body, hand, face
    systems['system.ERC721.Reveal']._setBaseURI(
      'https://kami-image.asphodel.io/image/'
    );
    setUpWorldAPI(systems).initWorld();


    createPlayerAPI(systems).account.register(
      '0x000000000000000000000000000000000000dead',
      'load_bearer'
    );
  }

  /// NOTE: do not use in production
  // @dev give coins for testing
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
    giveCoins,
    config: {
      set: {
        raw: setConfig,
        uri: {
          base: (v: string) => setConfigString('baseURI', v),
        },
        account: {
          stamina: {
            base: (v: number) => setConfig('ACCOUNT_STAMINA_BASE', v),
            recoveryPeriod: (v: number) => setConfig('ACCOUNT_STAMINA_RECOVERY_PERIOD', v),
          },
        },
        kami: {
          mint: {
            limit: (v: number) => setConfig('MINT_MAX', v),
            price: (v: number) => setConfig('MINT_PRICE', utils.parseEther(v.toString())),
          },
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
                  base: (v: number) => setConfig('HARVEST_RATE_MULT_AFF_BASE', v),
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
