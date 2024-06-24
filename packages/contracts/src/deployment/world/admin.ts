import { BigNumberish } from 'ethers';
import { createCall, toUint32FixedArrayLiteral } from '../commands/utils/systemCaller';
import { SystemAbis } from '../world/mappings/SystemAbis';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

export function createAdminAPI(compiledCalls: string[]) {
  // @dev generates an entry in json for calling systems
  // @param systemID system ID
  // @param args arguments to pass to the system
  // @param func optional, function name to call instead of executeTyped
  // @param typed optional, if true, skip argument encoding
  function genCall(systemID: keyof typeof SystemAbis, args: any[], func?: string, typed?: boolean) {
    const call = createCall(systemID, args, typed);
    compiledCalls.push(`    {
      "system": "${call.system}",
      "id": "${call.id}",
      "func": "${func ? func : 'execute'}",
      "args": "${call.args}"
    }`);
  }

  /////////////////
  // AUTH

  async function addRole(addr: string, role: string) {
    genCall('system._Auth.Manage.Role', [addr, role], 'addRole', true);
  }

  async function removeRole(addr: string, role: string) {
    genCall('system._Auth.Manage.Role', [addr, role], 'removeRole', true);
  }

  /////////////////
  //  CONFIG

  async function setConfig(field: string, value: BigNumberish) {
    genCall('system._Config.Set', [field, value]);
  }

  async function setConfigArray(field: string, value: number[]) {
    const arr = new Array(8);
    arr.fill(0);
    for (let i = 0; i < value.length; i++) arr[i] = value[i];
    genCall('system._Config.Set', [field, toUint32FixedArrayLiteral(arr)], 'setValueArray', true);
  }

  // values must be ≤ 32char
  async function setConfigString(field: string, value: string) {
    genCall('system._Config.Set', [field, value], 'setValueString', true);
  }

  /////////////////
  //  GOALS

  async function createGoal(
    goalIndex: number,
    name: string,
    description: string,
    roomIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    genCall('system.Goal.Create', [
      goalIndex,
      name,
      description,
      roomIndex,
      type,
      logic,
      conIndex,
      conValue,
    ]);
  }

  async function createGoalRequirement(
    goalIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    genCall('system.Goal.Create.Requirement', [goalIndex, type, logic, conIndex, conValue]);
  }

  async function createGoalReward(
    goalIndex: number,
    name: string,
    cutoff: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    genCall('system.Goal.Create.Reward', [
      goalIndex,
      name,
      cutoff,
      type,
      logic,
      conIndex,
      conValue,
    ]);
  }

  async function deleteGoal(goalIndex: number) {
    genCall('system.Goal.Delete', [goalIndex]);
  }

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  async function createNPC(index: number, name: string, roomIndex: number) {
    genCall('system._NPC.Create', [index, name, roomIndex]);
  }

  async function setNPCRoom(index: number, roomIndex: number) {
    genCall('system._NPC.Set.Room', [index, roomIndex]);
  }

  async function setNPCName(index: number, name: string) {
    genCall('system._NPC.Set.Name', [index, name]);
  }

  /////////////////
  // MINT

  async function initBatchMinter() {
    genCall('system.Pet721.BatchMint', [], 'setTraits', true);
  }

  async function batchMint(amount: number) {
    genCall('system.Pet721.BatchMint', [amount], 'batchMint', true);
  }

  async function initGachaIncrement() {
    genCall('system.Pet.Gacha.Mint', [], 'init', true);
  }

  // sets the prices for the merchant at the specified roomIndex
  async function setListing(
    merchantIndex: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    genCall('system._Listing.Set', [merchantIndex, itemIndex, buyPrice, sellPrice]);
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
    genCall('system._Node.Create', [index, type, roomIndex, name, description, affinity]);
  }

  // @dev deletes node
  async function deleteNode(index: number) {
    genCall('system._Node.Delete', [index]);
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
    endText: string,
    repeatTime: number
  ) {
    genCall('system._Registry.Quest.Create', [index, name, description, endText, repeatTime]);
  }

  // delete a quest along with its objectives, requirements and rewards
  async function deleteQuest(index: number) {
    genCall('system._Registry.Quest.Delete', [index]);
  }

  // creates a Objective for an existing Quest
  async function addQuestObjective(
    questIndex: number,
    name: string,
    logicType: string,
    type: string,
    index: number,
    value: BigNumberish
  ) {
    genCall('system._Registry.Quest.Create.Objective', [
      questIndex,
      name,
      logicType,
      type,
      index,
      value,
    ]);
  }

  // creates a Requirement for an existing Quest
  async function addQuestRequirement(
    questIndex: number,
    logicType: string,
    type: string,
    index: number,
    value: BigNumberish
  ) {
    genCall('system._Registry.Quest.Create.Requirement', [
      questIndex,
      logicType,
      type,
      index,
      value,
    ]);
  }

  // creates a Reward for an existing Quest
  async function addQuestReward(
    questIndex: number,
    type: string,
    index: number,
    value: BigNumberish
  ) {
    genCall('system._Registry.Quest.Create.Reward', [questIndex, type, index, value]);
  }

  /////////////////
  //  ROOMS

  // @dev creates a room with name, roomIndex and exits. cannot overwrite room at roomIndex
  async function createRoom(
    // location: { x: number; y: number; z: number },
    x: number,
    y: number,
    z: number,
    roomIndex: number,
    name: string,
    description: string,
    exits: number[]
  ) {
    genCall('system._Room.Create', [
      x,
      y,
      z,
      roomIndex,
      name,
      description,
      exits.length == 0 ? [] : exits,
    ]);
  }

  async function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: BigNumberish,
    type: string,
    logicType: string
  ) {
    genCall('system._Room.Create.Gate', [
      roomIndex,
      sourceIndex,
      conditionIndex,
      conditionValue,
      type,
      logicType,
    ]);
  }

  async function deleteRoom(roomIndex: number) {
    genCall('system._Room.Delete', [roomIndex]);
  }

  /////////////////
  // SKILLS

  async function createSkill(
    index: number,
    for_: string,
    type: string,
    tree: string,
    name: string,
    description: string,
    cost: number,
    max: number,
    treeTier: number,
    media: string
  ) {
    genCall('system._Registry.Skill.Create', [
      index,
      for_,
      type,
      tree,
      name,
      description,
      cost,
      max,
      treeTier,
      media,
    ]);
  }

  async function deleteSkill(index: number) {
    genCall('system._Registry.Skill.Delete', [index]);
  }

  async function addSkillEffect(skillIndex: number, type: string, subtype: string, value: number) {
    genCall('system._Registry.Skill.Create.Effect', [skillIndex, type, subtype, value]);
  }

  async function addSkillRequirement(
    skillIndex: number,
    type: string,
    logicType: string,
    index: number,
    value: number
  ) {
    genCall('system._Registry.Skill.Create.Requirement', [
      skillIndex,
      type,
      logicType,
      index,
      value,
    ]);
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
    genCall('system._Registry.Food.Create', [index, name, description, health, experience, media]);
  }

  async function registerLootbox(
    index: number,
    name: string,
    description: string,
    keys: number[],
    weights: number[],
    media: string
  ) {
    genCall('system._Registry.Lootbox.Create', [index, name, description, keys, weights, media]);
  }

  // @dev add a misc item in registry entry
  async function registerConsumable(
    index: number,
    name: string,
    description: string,
    type_: string,
    media: string
  ) {
    genCall('system._Registry.Create.Item.Consumable', [index, name, description, type_, media]);
  }

  // @dev add a revive item registry entry
  async function registerRevive(
    index: number,
    name: string,
    description: string,
    health: number,
    media: string
  ) {
    genCall('system._Registry.Revive.Create', [index, name, description, health, media]);
  }

  // @dev deletes an item registry
  async function deleteItem(index: number) {
    genCall('system._Registry.Item.Delete', [index]);
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
    genCall('system._Registry.Trait.Create', [
      index,
      health,
      power,
      violence,
      harmony,
      slots,
      rarity,
      affinity,
      name,
      type,
    ]);
  }

  // @dev deletes trait
  async function deleteTrait(index: number, type: string) {
    genCall('system._Registry.Trait.Delete', [index, type]);
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
    genCall('system._Registry.Relationship.Create', [
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist,
    ]);
  }

  async function updateRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    genCall('system._Registry.Relationship.Update', [
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist,
    ]);
  }

  async function deleteRelationship(indexNPC: number, indexRelationship: number) {
    genCall('system._Registry.Relationship.Delete', [indexNPC, indexRelationship]);
  }

  return {
    gen: genCall,
    auth: {
      roles: {
        add: addRole,
        remove: removeRole,
      },
    },
    config: {
      set: {
        array: setConfigArray,
        number: setConfig,
        string: setConfigString,
      },
    },
    goal: {
      create: createGoal,
      add: {
        requirement: createGoalRequirement,
        reward: createGoalReward,
      },
      delete: deleteGoal,
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
