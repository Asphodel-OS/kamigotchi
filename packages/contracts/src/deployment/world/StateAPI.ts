import { BigNumberish } from "ethers";
import { parseCall } from "../commands/utils/systemCall";
import { SystemAbis } from "./abis/SystemAbis";

/// @note not currently in use, but archived in the codebase to potentially be useful someday
/**
 * This is adapted off admin.ts from the client package,
 * but instead of calling the system directly, it parses outputs that foundry scripts can parse through
 *
 * Not implemented as of now – some challenges wrt handling arrays and structs
 */

export type StateAPI = Awaited<ReturnType<typeof createStateAPI>>;

export function createStateAPI(compiledCalls: string[]) {
  function call(system: keyof typeof SystemAbis, args: any[]) {
    const data = parseCall(system, args);
    let result = data.system + ", abi.encode(" + data.args + ")";
    result = result.replace(/\n/g, "\\n");
    result = result.replace(/[\u2018\u2019]/g, "'");
    result = result.replace(/[\u201C\u201D]/g, '\\"');
    result = result.replace(/[\u2026]/g, "...");
    compiledCalls.push(result);
    // console.log(result);
  }
  /////////////////
  // ACCOUNTS

  function registerAccount(operatorAddress: BigNumberish, name: string, food: string) {
    return call("system.Account.Register", [operatorAddress, name, food]);
  }

  /////////////////
  //  CONFIG

  function setConfig(field: string, value: BigNumberish) {
    return call("system._Config.Set", [field, value]);
  }

  // values must be ≤ 32char
  function setConfigString(field: string, value: string) {
    return call("system._Config.Set.String", [field, value]);
  }

  function setConfigWei(field: string, value: BigNumberish) {
    return call("system._Config.Set.Wei", [field, value]);
  }

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  function createNPC(index: number, name: string, roomIndex: number) {
    return call("system._NPC.Create", [index, name, roomIndex]);
  }

  function setNPCRoom(index: number, roomIndex: number) {
    return call("system._NPC.Set.Room", [index, roomIndex]);
  }

  function setNPCName(index: number, name: string) {
    return call("system._NPC.Set.Name", [index, name]);
  }

  // /////////////////
  // // MINT

  // function initBatchMinter() {
  //   return call("system.Pet721.BatchMint".setTraits();
  // }

  // function batchMint(amount: number) {
  //   return call("system.Pet721.BatchMint".batchMint(amount);
  // }

  // function initGachaIncrement() {
  //   return call("system.Pet.Gacha.Mint".init(0);
  // }

  // sets the prices for the merchant at the specified roomIndex
  function setListing(
    merchantIndex: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    return call("system._Listing.Set", [merchantIndex, itemIndex, buyPrice, sellPrice]);
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
  function createNode(
    index: number,
    type: string,
    roomIndex: number,
    name: string,
    description: string,
    affinity: string
  ) {
    return call("system._Node.Create", [index, type, roomIndex, name, description, affinity]);
  }

  // @dev deletes node
  function deleteNode(index: number) {
    return call("system._Node.Delete", [index]);
  }

  /////////////////
  // QUESTS

  // @dev creates an empty quest
  // @param index       the human-readable index of the quest
  // @param name        name of the quest
  function createQuest(
    index: number,
    name: string,
    description: string,
    roomIndex: number,
    repeatTime: number
  ) {
    return call("system._Registry.Quest.Create", [index, name, description, roomIndex, repeatTime]);
  }

  // delete a quest along with its objectives, requirements and rewards
  function deleteQuest(index: number) {
    return call("system._Registry.Quest.Delete", [index]);
  }

  // creates a Objective for an existing Quest
  function addQuestObjective(
    questIndex: number,
    name: string,
    logicType: string,
    type: string,
    index: number,
    value: number
  ) {
    return call("system._Registry.Quest.Create.Objective", [
      questIndex,
      name,
      logicType,
      type,
      index,
      value,
    ]);
  }

  // creates a Requirement for an existing Quest
  function addQuestRequirement(
    questIndex: number,
    logicType: string,
    type: string,
    index: number,
    value: number
  ) {
    return call("system._Registry.Quest.Create.Requirement", [
      questIndex,
      logicType,
      type,
      index,
      value,
    ]);
  }

  // creates a Reward for an existing Quest
  function addQuestReward(questIndex: number, type: string, index: number, value: number) {
    return call("system._Registry.Quest.Create.Reward", [questIndex, type, index, value]);
  }

  /////////////////
  //  ROOMS

  // @dev creates a room with name, roomIndex and exits. cannot overwrite room at roomIndex
  function createRoom(
    location: { x: number; y: number; z: number },
    roomIndex: number,
    name: string,
    description: string,
    exits: number[]
  ) {
    const loc = `Location(${location.x},${location.y},${location.z})`;
    return call("system._Room.Create", [
      loc,
      roomIndex,
      name,
      description,
      exits.length == 0 ? [] : exits,
    ]);
  }

  function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: number,
    logicType: string,
    type: string
  ) {
    return call("system._Room.Create.Gate", [
      roomIndex,
      sourceIndex,
      conditionIndex,
      conditionValue,
      logicType,
      type,
    ]);
  }

  function deleteRoom(roomIndex: number) {
    return call("system._Room.Delete", [roomIndex]);
  }

  /////////////////
  // SKILLS

  function createSkill(
    index: number,
    for_: string,
    type: string,
    name: string,
    cost: number,
    max: number,
    description: string,
    media: string
  ) {
    return call("system._Registry.Skill.Create", [
      index,
      for_,
      type,
      name,
      cost,
      max,
      description,
      media,
    ]);
  }

  function deleteSkill(index: number) {
    return call("system._Registry.Skill.Delete", [index]);
  }

  function addSkillEffect(
    skillIndex: number,
    type: string,
    subtype: string,
    logicType: string,
    index: number,
    value: number
  ) {
    return call("system._Registry.Skill.Create.Effect", [
      skillIndex,
      type,
      subtype,
      logicType,
      index,
      value,
    ]);
  }

  function addSkillRequirement(skillIndex: number, type: string, index: number, value: number) {
    return call("system._Registry.Skill.Create.Requirement", [skillIndex, type, index, value]);
  }

  /////////////////
  //  ITEMS

  // @dev add a food item registry entry
  function registerFood(
    index: number,
    name: string,
    description: string,
    health: number,
    experience: number,
    media: string
  ) {
    return call("system._Registry.Food.Create", [
      index,
      name,
      description,
      health,
      experience,
      media,
    ]);
  }

  function registerLootbox(
    index: number,
    name: string,
    description: string,
    keys: number[],
    weights: number[],
    media: string
  ) {
    return call("system._Registry.Lootbox.Create", [
      index,
      name,
      description,
      keys,
      weights,
      media,
    ]);
  }

  // @dev add a misc item in registry entry
  function registerConsumable(
    index: number,
    name: string,
    description: string,
    type_: string,
    media: string
  ) {
    return call("system._Registry.Create.Item.Consumable", [
      index,
      name,
      description,
      type_,
      media,
    ]);
  }

  // @dev add a revive item registry entry
  function registerRevive(
    index: number,
    name: string,
    description: string,
    health: number,
    media: string
  ) {
    return call("system._Registry.Revive.Create", [index, name, description, health, media]);
  }

  // @dev deletes an item registry
  function deleteItem(index: number) {
    return call("system._Registry.Item.Delete", [index]);
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
    return call("system._Registry.Trait.Create", [
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
  function deleteTrait(index: number, type: string) {
    return call("system._Registry.Trait.Delete", [index, type]);
  }

  //////////////////
  // RELATIONSHIPS

  function registerRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    return call("system._Registry.Relationship.Create", [
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist,
    ]);
  }

  function updateRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    return call("system._Registry.Relationship.Update", [
      indexNPC,
      indexRelationship,
      name,
      whitelist,
      blacklist,
    ]);
  }

  function deleteRelationship(indexNPC: number, indexRelationship: number) {
    return call("system._Registry.Relationship.Delete", [indexNPC, indexRelationship]);
  }

  return {
    account: {
      create: registerAccount,
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
    // mint: {
    //   batchMinter: {
    //     init: initBatchMinter,
    //     mint: batchMint,
    //   },
    //   gacha: {
    //     init: initGachaIncrement,
    //   },
    // },
    // forceReveal: {
    //   pet: petForceReveal,
    //   lootbox: lootboxForceReveal,
    // },
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
