import { utils, BigNumberish } from 'ethers';

export function createAdminAPI(systems: any) {
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
  // QUESTS

  // @dev creates an empty quest
  // @param index       the human-readable index of the quest
  // @param name        name of the quest
  async function createQuest(
    index: number,
    name: string,
    description: string,
    location: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create'].executeTyped(
      index,
      name,
      description,
      location
    );
  }

  // creates a Objective for an existing Quest
  async function addQuestObjective(
    questIndex: number,
    name: string,
    logicType: string,
    type: string,
    index: number,
    value: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create.Objective'].executeTyped(
      questIndex,
      name,
      logicType,
      type,
      index,
      value
    );
  }

  // creates a Requirement for an existing Quest
  async function addQuestRequirement(
    questIndex: number,
    logicType: string,
    type: string,
    index: number,
    value: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create.Requirement'].executeTyped(
      questIndex,
      logicType,
      type,
      index,
      value
    );
  }

  // creates a Reward for an existing Quest
  async function addQuestReward(
    questIndex: number,
    type: string,
    index: number,
    value: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create.Reward'].executeTyped(
      questIndex,
      type,
      index,
      value
    );
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
    giveCoins,
    config: {
      set: {
        number: setConfig,
        string: setConfigString,
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
    quest: {
      create: createQuest,
      add: {
        objective: addQuestObjective,
        requirement: addQuestRequirement,
        reward: addQuestReward,
      }
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
