import { BigNumberish } from "ethers";
import { createPlayerAPI } from "./player";

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

    // createMerchant("ugajin", 4);
    // setListing(4, 1, 10, 5); // merchant, item index, buy price, sell price
    // setListing(4, 2, 30, 15);
    // setListing(4, 3, 50, 25);

    // set food merchant for each room
    for (let i = 1; i < 5; i++) {
      createMerchant("hawker", i);
      setListing(i, 1, 10, 5); // merchant, item index, buy price, sell price
      setListing(i, 2, 30, 15);
      setListing(i, 3, 50, 25);
    }

    // init general
    systems["system._Init"].executeTyped(); // creates food and modifier registry  
    systems["system.ERC721.metadata"]._setRevealed("123", "https://kamigotchi.nyc3.cdn.digitaloceanspaces.com/images%2F");
    // systems["system.ERC721.metadata"]._setMaxElements(['9', '1', '7', '8', '1']); 
    systems["system.ERC721.metadata"]._setMaxElements(['2', '1', '2', '2', '1']);

    createPlayerAPI(systems).ERC721.mint('0x7681A73aed06bfb648a5818B978fb018019F6900');

  }

  // @dev creates a merchant with the name at the specified location
  // @param location  room ID
  // @param name      name of the merchant
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
  // @param location    location of the merchant
  // @param itemIndex   index of item to list
  // @param buyPrice    sell price of item listing (pass in 0 to leave blank)
  // @param sellPrice   buy price of item listing (pass in 0 to leave blank)
  // @return uint       (promise) entity ID of the listing
  function setListing(
    location: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    return systems["system._Listing.Set"].executeTyped(location, itemIndex, buyPrice, sellPrice);
  }

  /////////////////
  //  REGISTRIES

  // @dev adds a modifier registry
  function registerModifier(
    index: number,
    value: number,
    type: string,
    name: string
  ) {
    return systems["system._Modifier.Add"].executeTyped(
      index,
      value,
      type,
      name
    );
  }

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
      harmony,
      violence
    );
  }

  function updateRegistryModification(
    modIndex: number,
    name: string,
    health: number,
    power: number,
    harmony: number,
    violence: number
  ) {
    return systems["system._Registry.Mod.Set"].executeTyped(
      modIndex,
      name,
      health,
      power,
      harmony,
      violence
    );
  }

  return {
    init,
    giveCoins,
    registry: {
      modifier: {
        create: registerModifier,
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
