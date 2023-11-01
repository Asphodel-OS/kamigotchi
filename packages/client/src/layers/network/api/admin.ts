import { BigNumberish } from 'ethers';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

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

  // @dev admin reveal for lootbox if blockhash has lapsed
  async function lootboxForceReveal(entityID: string) {
    return systems['system.Lootbox.Reveal.Execute'].forceReveal(entityID);
  }

  // @dev cancels outgoing bridge tx
  async function cancelBridgeTx(id: string) {
    return systems["system.Farm20.Withdraw"].cancelWithdraw(id);
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
  //  NPCs

  // (creates an NPC with the name at the specified location
  async function createNPC(index: number, name: string, location: number) {
    await sleepIf();
    return systems['system._NPC.Create'].executeTyped(index, name, location);
  }

  async function setNPCLocation(index: number, location: number) {
    await sleepIf();
    return systems['system._NPC.Set.Location'].executeTyped(index, location);
  }

  async function setNPCName(index: number, name: string) {
    await sleepIf();
    return systems['system._NPC.Set.Name'].executeTyped(index, name);
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
    location: number,
    repeatTime: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create'].executeTyped(
      index,
      name,
      description,
      location,
      repeatTime
    );
  }

  // delete a quest along with its objectives, requirements and rewards
  async function deleteQuest(index: number) {
    await sleepIf();
    return systems['system._Registry.Quest.Delete'].executeTyped(index);
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
  // SKILLS

  async function createSkill(
    index: number,
    for_: string,
    type: string,
    name: string,
    cost: number,
    max: number,
    description: string,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Skill.Create'].executeTyped(
      index,
      for_,
      type,
      name,
      cost,
      max,
      description,
      media
    );
  }

  async function deleteSkill(index: number) {
    await sleepIf();
    return systems['system._Registry.Skill.Delete'].executeTyped(index);
  }

  async function addSkillEffect(
    skillIndex: number,
    type: string,
    subtype: string,
    logicType: string,
    index: number,
    value: number,
  ) {
    await sleepIf();
    return systems['system._Registry.Skill.Create.Effect'].executeTyped(
      skillIndex,
      type,
      subtype,
      logicType,
      index,
      value,
    );
  }

  async function addSkillRequirement(
    skillIndex: number,
    type: string,
    index: number,
    value: number
  ) {
    await sleepIf();
    return systems['system._Registry.Skill.Create.Requirement'].executeTyped(
      skillIndex,
      type,
      index,
      value
    );
  }


  /////////////////
  //  ITEMS

  // @dev add a food item registry entry
  async function registerFood(
    index: number,
    foodIndex: number,
    name: string,
    description: string,
    health: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Food.Create'].executeTyped(
      index,
      foodIndex,
      name,
      description,
      health,
      media
    );
  }

  // @dev add an equipment item registry entry
  async function registerGear(
    index: number,
    gearIndex: number,
    name: string,
    description: string,
    type_: string,
    health: number,
    power: number,
    violence: number,
    harmony: number,
    slots: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Gear.Create'].executeTyped(
      index,
      gearIndex,
      name,
      description,
      type_,
      health,
      power,
      violence,
      harmony,
      slots,
      media
    );
  }

  async function registerLootbox(
    index: number,
    name: string,
    description: string,
    keys: number[],
    weights: number[],
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Lootbox.Create'].executeTyped(
      index,
      name,
      description,
      keys,
      weights,
      media
    );
  }

  // @dev add a modification item registry entry
  async function registerModification(
    index: number,
    modIndex: number,
    name: string,
    description: string,
    health: number,
    power: number,
    harmony: number,
    violence: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Mod.Create'].executeTyped(
      index,
      modIndex,
      name,
      description,
      health,
      power,
      violence,
      harmony,
      media
    );
  }

  // @dev add a revive item registry entry
  async function registerRevive(
    index: number,
    reviveIndex: number,
    name: string,
    description: string,
    health: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Revive.Create'].executeTyped(
      index,
      reviveIndex,
      name,
      description,
      health,
      media
    );
  }

  // @dev deletes an item registry
  async function deleteItem(index: number) {
    await sleepIf();
    return systems['system._Registry.Item.Delete'].executeTyped(index);
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

  //////////////////
  // RELATIONSHIPS

  async function registerRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    await sleepIf();
    return systems['system._Registry.Relationship.Create'].executeTyped(
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist
    );
  }

  async function updateRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    await sleepIf();
    return systems['system._Registry.Relationship.Update'].executeTyped(
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist
    );
  }

  async function deleteRelationship(indexNPC: number, indexRelationship: number) {
    await sleepIf();
    return systems['system._Registry.Relationship.Delete'].executeTyped(
      indexNPC,
      indexRelationship
    );
  }


  //////////////////
  // WAITS

  function sleepIf() {
    if (process.env.MODE == 'OPGOERLI' || process.env.MODE == 'TEST') {
      return new Promise(resolve => setTimeout(resolve, 8000));
    }
  }

  return {
    giveCoins,
    bridge: {
      cancel: cancelBridgeTx,
    },
    config: {
      set: {
        number: setConfig,
        string: setConfigString,
      },
    },
    listing: { set: setListing },
    node: {
      create: createNode,
      set: {
        affinity: setNodeAffinity,
        description: setNodeDescription,
        location: setNodeLocation,
        name: setNodeName,
      },
    },
    npc: {
      create: createNPC,
      set: {
        location: setNPCLocation,
        name: setNPCName,
      },
    },
    forceReveal: {
      pet: petForceReveal,
      lootbox: lootboxForceReveal,
    },
    registry: {
      item: {
        create: {
          food: registerFood,
          gear: registerGear,
          lootbox: registerLootbox,
          modification: registerModification,
          revive: registerRevive,
        },
        delete: deleteItem,
      },
      trait: {
        create: registerTrait,
      },
      quest: {
        create: createQuest,
        delete: deleteQuest,
        add: {
          objective: addQuestObjective,
          requirement: addQuestRequirement,
          reward: addQuestReward,
        }
      },
      relationship: {
        create: registerRelationship,
        update: updateRelationship,
        delete: deleteRelationship,
      },
      skill: {
        create: createSkill,
        delete: deleteSkill,
        add: {
          effect: addSkillEffect,
          requirement: addSkillRequirement,
        }
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
