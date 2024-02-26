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
  async function petForceReveal(commitIDs: BigNumberish[]) {
    return systems['system.Pet.Gacha.Reveal'].forceReveal(commitIDs);
  }

  // @dev admin reveal for lootbox if blockhash has lapsed
  async function lootboxForceReveal(entityID: string) {
    return systems['system.Lootbox.Reveal.Execute'].forceReveal(entityID);
  }

  // @dev cancels outgoing bridge tx
  async function cancelBridgeTx(id: string) {
    return systems['system.Farm20.Withdraw'].cancelWithdraw(id);
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

  async function setConfigWei(field: string, value: BigNumberish) {
    await sleepIf();
    return systems['system._Config.Set.Wei'].executeTyped(field, value);
  }

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  async function createNPC(index: number, name: string, roomIndex: number) {
    await sleepIf();
    return systems['system._NPC.Create'].executeTyped(index, name, roomIndex);
  }

  async function setNPCRoom(index: number, roomIndex: number) {
    await sleepIf();
    return systems['system._NPC.Set.Room'].executeTyped(index, roomIndex);
  }

  async function setNPCName(index: number, name: string) {
    await sleepIf();
    return systems['system._NPC.Set.Name'].executeTyped(index, name);
  }

  /////////////////
  // MINT

  async function initBatchMinter() {
    await sleepIf();
    return systems['system.Pet721.BatchMint'].setTraits();
  }

  async function batchMint(amount: number) {
    await sleepIf();
    return systems['system.Pet721.BatchMint'].batchMint(amount);
  }

  async function initGachaIncrement() {
    await sleepIf();
    return systems['system.Pet.Gacha.Mint'].init(0);
  }

  // sets the prices for the merchant at the specified roomIndex
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

  // @dev creates an emission node at the specified roomIndex
  // @param index       the human-readable index of the node
  // @param type        type of the node (e.g. HARVEST, HEAL, ARENA)
  // @param roomIndex    index of the room roomIndex
  // @param name        name of the node
  // @param description description of the node, exposed on the UI
  // @param affinity    affinity of the node [ NORMAL | EERIE | INSECT | SCRAP ]
  async function createNode(
    index: number,
    type: string,
    roomIndex: number,
    name: string,
    description: string,
    affinity: string
  ) {
    await sleepIf();
    return systems['system._Node.Create'].executeTyped(
      index,
      type,
      roomIndex,
      name,
      description,
      affinity
    );
  }

  // @dev deletes node
  async function deleteNode(index: number) {
    await sleepIf();
    return systems['system._Node.Delete'].executeTyped(index);
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
    roomIndex: number,
    repeatTime: number
  ) {
    await sleepIf();
    return systems['system._Registry.Quest.Create'].executeTyped(
      index,
      name,
      description,
      roomIndex,
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
  async function addQuestReward(questIndex: number, type: string, index: number, value: number) {
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

  // @dev creates a room with name, roomIndex and exits. cannot overwrite room at roomIndex
  async function createRoom(
    location: { x: number; y: number; z: number },
    roomIndex: number,
    name: string,
    description: string,
    exits: number[]
  ) {
    await sleepIf();
    return systems['system._Room.Create'].executeTyped(
      location,
      roomIndex,
      name,
      description,
      exits.length == 0 ? [] : exits
    );
  }

  async function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: number,
    logicType: string,
    type: string
  ) {
    await sleepIf();
    return systems['system._Room.Create.Gate'].executeTyped(
      roomIndex,
      sourceIndex,
      conditionIndex,
      conditionValue,
      logicType,
      type
    );
  }

  async function deleteRoom(roomIndex: number) {
    await sleepIf();
    return systems['system._Room.Delete'].executeTyped(roomIndex);
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
    value: number
  ) {
    await sleepIf();
    return systems['system._Registry.Skill.Create.Effect'].executeTyped(
      skillIndex,
      type,
      subtype,
      logicType,
      index,
      value
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
    name: string,
    description: string,
    health: number,
    experience: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Food.Create'].executeTyped(
      index,
      name,
      description,
      health,
      experience,
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

  // @dev add a misc item in registry entry
  async function registerConsumable(
    index: number,
    name: string,
    description: string,
    type_: string,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Create.Item.Consumable'].executeTyped(
      index,
      name,
      description,
      type_,
      media
    );
  }

  // @dev add a revive item registry entry
  async function registerRevive(
    index: number,
    name: string,
    description: string,
    health: number,
    media: string
  ) {
    await sleepIf();
    return systems['system._Registry.Revive.Create'].executeTyped(
      index,
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

  // @dev deletes trait
  async function deleteTrait(index: number, type: string) {
    await sleepIf();
    return systems['system._Registry.Trait.Delete'].executeTyped(index, type);
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
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || process.env.MODE;
    if (mode && mode == 'TEST') {
      console.log('sleeping');
      return new Promise((resolve) => setTimeout(resolve, 8000));
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
        wei: setConfigWei,
      },
    },
    listing: {
      set: setListing,
    },
    node: {
      create: createNode,
      delete: deleteNode,
    },
    npc: {
      create: createNPC,
      set: {
        room: setNPCRoom,
        name: setNPCName,
      },
    },
    mint: {
      batchMinter: {
        init: initBatchMinter,
        mint: batchMint,
      },
      gacha: {
        init: initGachaIncrement,
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
          lootbox: registerLootbox,
          consumable: registerConsumable,
          revive: registerRevive,
        },
        delete: deleteItem,
      },
      trait: {
        create: registerTrait,
        delete: deleteTrait,
      },
      quest: {
        create: createQuest,
        delete: deleteQuest,
        add: {
          objective: addQuestObjective,
          requirement: addQuestRequirement,
          reward: addQuestReward,
        },
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
        },
      },
    },
    room: {
      create: createRoom,
      createGate: createRoomGate,
      delete: deleteRoom,
    },
  };
}
