import { createPlayerAPI } from './player';
import { setUpWorldAPI } from './world';

export function createAdminAPI(systems: any) {
  function init() {
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
    createRoom('Fores: Insect Node', 10, [9]);
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
    setNodeAffinity('Torii Gate', 'NORMAL');

    createNode(
      'Trash Compactor',
      7,
      'HARVEST',
      'Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor Trash compactor.'
    );
    setNodeAffinity('Trash Compactor', 'SCRAP');

    createNode(
      'Termite Mound',
      10,
      'HARVEST',
      'A huge termite mound. Apparently, this is sacred to the local insects.'
    );
    setNodeAffinity('Termite Mound', 'INSECT');

    createNode(
      'Occult Circle',
      14,
      'HARVEST',
      'The energy invested here calls out to EERIE Kamigotchi.'
    );
    setNodeAffinity('Occult Circle', 'EERIE');

    createNode(
      'Danger Zone',
      12,
      'HARVEST',
      'Danger Zone'
    );
    setNodeAffinity('Danger Zone', 'SCRAP');


    // create food registry items
    registerFood(1, 'Maple-Flavor Ghost Gum', 25);
    registerFood(2, 'Pom-Pom Fruit Candy', 100);
    registerFood(3, 'Gakki Cookie Sticks', 200);

    // create revive registry items
    registerRevive(1, 'Red Gakki Ribbon', 10);

    // set listings on global merchant
    createMerchant('hawker', 0);
    setListing('hawker', 1, 25, 0); // merchant, item index, buy price, sell price
    setListing('hawker', 2, 90, 0);
    setListing('hawker', 3, 160, 0);
    setListing('hawker', 4, 500, 0);

    // // create our hottie merchant ugajin. names are unique
    createMerchant('ugajin', 13);
    setListing('ugajin', 1, 25, 0); // merchant, item index, buy price, sell price
    setListing('ugajin', 2, 90, 0);
    setListing('ugajin', 3, 150, 0);
    setListing('ugajin', 4, 500, 0);

    // init general, TODO: move to worldSetUp
    systems['system._Init'].executeTyped(); // sets the balance of the Kami contract

    setUpWorldAPI(systems).initWorld();
    createPlayerAPI(systems).ERC721.mint(
      '0x7681A73aed06bfb648a5818B978fb018019F6900'
    );
  }

  // @dev creates a merchant with the name at the specified location
  // @param location  room ID
  // @param name      name of the merchant (must be unique)
  // @return uint     (promise) entity ID of the merchant
  function createMerchant(name: string, location: number) {
    return systems['system._Merchant.Create'].executeTyped(name, location);
  }

  // @dev creates an emission node at the specified location
  // @param name      name of the node
  // @param location  index of the room location
  // @param type      type of the node (e.g. HARVEST, HEAL, ARENA)
  // @param desc      description of the node, exposed on the UI
  function createNode(name: string, location: number, type: string, desc: string) {
    return systems['system._Node.Create'].executeTyped(name, location, type, desc);
  }

  // @dev creates a room with name, location and exits. cannot overwrite room at location
  function createRoom(name: string, location: number, exits: number[]) {
    return systems['system._Room.Create'].executeTyped(name, location, exits);
  }

  // @dev give coins for testing. to be removed for live
  // @param amount      amount
  function giveCoins(amount: number) {
    return systems['system._devGiveTokens'].executeTyped(amount);
  }

  // @dev admin reveal for pet if blockhash has lapsed. only called by admin
  // @param tokenId     ERC721 tokenId of the pet
  function petForceReveal(tokenId: number) {
    return systems['system.ERC721.metadata'].forceReveal(tokenId);
  }

  // @dev sets the prices for the merchant at the specified location
  // @param name        name of the merchant
  // @param itemIndex   index of item to list
  // @param buyPrice    sell price of item listing (pass in 0 to leave blank)
  // @param sellPrice   buy price of item listing (pass in 0 to leave blank)
  // @return uint       (promise) entity ID of the listing
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
    giveCoins,
    ERC721: { forceReveal: petForceReveal },
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
