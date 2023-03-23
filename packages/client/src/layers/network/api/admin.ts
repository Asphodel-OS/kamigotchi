import { BigNumberish } from "ethers";
import { createPlayerAPI } from "./player";
import { setUpWorldAPI } from "./world";

export function createAdminAPI(systems: any) {
  function init() {
    createRoom("deadzone", 0, [1]); // in case we need this
    createRoom("Quiet Forest", 1, [2]);
    createRoom("Vending Machine", 2, [1, 3]);
    createRoom("Corridor", 3, [2, 4]);
    createRoom("Kami Shop", 4, [3]);

    createNode("Eerie Willow", 1);
    createNode("Trash Compactor", 2);
    createNode("Pristine Couch", 3);
    createNode("Cash Register", 4);

    // create our hottie merchant ugajin. names are unique
    createMerchant("ugajin", 4);
    setListing("ugajin", 1, 10, 5); // merchant, item index, buy price, sell price
    setListing("ugajin", 2, 30, 15);
    setListing("ugajin", 3, 50, 25);

    // global merchant
    createMerchant("hawker", 0);
    setListing("hawker", 1, 10, 5); // merchant, item index, buy price, sell price
    setListing("hawker", 2, 30, 15);
    setListing("hawker", 3, 50, 25);


    // init general, TODO: move to worldSetUp
    systems["system._Init"].executeTyped(); // creates food and modifier registry  
    systems["system.ERC721.metadata"]._setRevealed("123", "http://159.223.244.145:8080/image/");
    // systems["system.ERC721.metadata"]._setRevealed("123", "http://localhost:8080/image/");
    systems["system.ERC721.metadata"]._setMaxElements(['13', '26', '14', '15', '30']);

    createPlayerAPI(systems).ERC721.mint('0x7681A73aed06bfb648a5818B978fb018019F6900');
    setUpWorldAPI(systems).initWorld();

  }

  // @dev creates a merchant with the name at the specified location
  // @param location  room ID
  // @param name      name of the merchant (must be unique)
  // @return uint     (promise) entity ID of the merchant
  function createMerchant(name: string, location: number) {
    return systems["system._Merchant.Create"].executeTyped(name, location);
  }

  // @dev creates an emission node at the specified location
  // @param name      name of the deposit (exposed in mining modal)
  // @param location  index of the room location
  // @return uint     entity ID of the deposit
  function createNode(name: string, location: number) {
    return systems["system._Node.Create"].executeTyped(name, location);
  }

  // @dev creates a room with name, location and exits. cannot overwrite room at location
  function createRoom(name: string, location: number, exits: number[]) {
    return systems["system._Room.Create"].executeTyped(name, location, exits);
  }

  // @dev give coins for testing. to be removed for live
  // @param amount      amount
  function giveCoins(amount: number) {
    return systems["system._devGiveTokens"].executeTyped(amount);
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
    return systems["system._Listing.Set"].executeTyped(name, itemIndex, buyPrice, sellPrice);
  }

  /////////////////
  //  REGISTRIES

  // @dev add an equipment item registry entry
  function registerEquipment(
    GearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    return systems["system._Registry.Gear.Create"].executeTyped(
      GearIndex,
      name,
      type_,
      health,
      power,
      violence,
      harmony,
      slots,
    )
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
    return systems["system._Registry.Mod.Create"].executeTyped(
      modIndex,
      name,
      health,
      power,
      violence,
      harmony,
    );
  }

  // @dev adds a trait in registry
  function registerTrait(
    index: number,
    value: number,
    genus: string,
    type: string,
    affinity: string,
    name: string
  ) {
    return systems["system._Trait.Add"].executeTyped(
      index,
      value,
      genus,
      type,
      affinity,
      name
    );
  }

  // @dev update an equipment item registry entry
  function updateRegistryEquipment(
    GearIndex: number,
    name: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number
  ) {
    return systems["system._Registry.Gear.Update"].executeTyped(
      GearIndex,
      name,
      type_,
      health,
      power,
      violence,
      harmony,
      slots,
    )
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
    return systems["system._Registry.Mod.Update"].executeTyped(
      modIndex,
      name,
      health,
      power,
      violence,
      harmony,
    );
  }

  return {
    init,
    giveCoins,
    registry: {
      gear: {
        create: registerEquipment,
        update: updateRegistryEquipment,
      },
      trait: {
        create: registerTrait,
      },
      modification: {
        create: registerModification,
        update: updateRegistryModification,
      }
    },
    merchant: { create: createMerchant },
    node: { create: createNode },
    room: { create: createRoom },
    listing: { set: setListing },
  };
}
