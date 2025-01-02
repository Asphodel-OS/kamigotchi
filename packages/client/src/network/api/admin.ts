import { defaultAbiCoder } from '@ethersproject/abi';
import { BigNumberish } from 'ethers';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

export function createAdminAPI(systems: any) {
  // @dev admin reveal for pet if blockhash has lapsed. only called by admin
  // @param tokenId     ERC721 tokenId of the pet
  async function petForceReveal(commitIDs: BigNumberish[]) {
    return systems['system.kami.gacha.reveal'].forceReveal(commitIDs);
  }

  // @dev admin reveal for droptables if blockhash has lapsed
  async function droptableForceReveal(entityID: string) {
    return systems['system.droptable.item.reveal'].forceReveal(entityID);
  }

  // @dev admin reveal for droptables if commit was broken by upgrades
  async function droptableReplaceReveal(entityID: string) {
    return systems['system.droptable.item.reveal'].replaceBrokenReveal(entityID);
  }

  /////////////////
  // AUTH

  async function addRole(addr: string, role: string) {
    await sleepIf();
    return systems['system._Auth.Manage.Role'].addRole(addr, role);
  }

  async function removeRole(addr: string, role: string) {
    await sleepIf();
    return systems['system._Auth.Manage.Role'].removeRole(addr, role);
  }

  /////////////////
  // COMMUNITY MANAGEMENT

  // @dev for admins - give stuff to users
  async function adminGive(addr: string, type: string, itemIndex: number, amount: number) {
    await sleepIf();
    return systems['system._Admin.Give'].executeTyped(addr, type, itemIndex, amount);
  }

  /////////////////
  //  CONFIG

  async function setConfig(field: string, value: BigNumberish) {
    await sleepIf();
    return systems['system._Config.Set'].setValue(field, value);
  }

  async function setConfigArray(field: string, value: number[]) {
    await sleepIf();
    const arr = new Array(8);
    arr.fill(0);
    for (let i = 0; i < value.length; i++) arr[i] = value[i];
    return systems['system._Config.Set'].setValueArray(field, arr);
  }

  // values must be ≤ 32char
  async function setConfigString(field: string, value: string) {
    await sleepIf();
    return systems['system._Config.Set'].setValueString(field, value);
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
    await sleepIf();
    return systems['system.goal.registry'].create(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'uint32', 'string', 'string', 'uint32', 'uint256'],
        [goalIndex, name, description, roomIndex, type, logic, conIndex, conValue]
      )
    );
  }

  async function createGoalRequirement(
    goalIndex: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    await sleepIf();
    return systems['system.goal.registry'].addRequirement(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'uint32', 'uint256'],
        [goalIndex, type, logic, conIndex, conValue]
      )
    );
  }

  async function createGoalReward(
    goalIndex: number,
    name: string,
    tier: number,
    type: string,
    logic: string,
    conIndex: number,
    conValue: number
  ) {
    await sleepIf();
    return systems['system.goal.registry'].addReward(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'uint256', 'string', 'string', 'uint32', 'uint256'],
        [goalIndex, name, tier, type, logic, conIndex, conValue]
      )
    );
  }

  async function deleteGoal(goalIndex: number) {
    await sleepIf();
    return systems['system.goal.registry'].remove(goalIndex);
  }

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  async function createNPC(index: number, name: string, roomIndex: number) {
    await sleepIf();
    return systems['system.npc.registry'].create(
      defaultAbiCoder.encode(['uint32', 'string', 'uint32'], [index, name, roomIndex])
    );
  }

  async function setNPCRoom(index: number, roomIndex: number) {
    await sleepIf();
    return systems['system.npc.registry'].setRoom(index, roomIndex);
  }

  async function setNPCName(index: number, name: string) {
    await sleepIf();
    return systems['system.npc.registry'].setName(index, name);
  }

  /////////////////
  // MINT

  async function initBatchMinter() {
    await sleepIf();
    return systems['system.Kami721.BatchMint'].setTraits();
  }

  async function batchMint(amount: number) {
    const perBatch = 7;
    for (let i = 0; i < amount; i += perBatch) {
      await systems['system.Kami721.BatchMint'].batchMint(perBatch);
      await sleepIf();
    }
    await systems['system.Kami721.BatchMint'].batchMint(amount % perBatch);
  }

  async function initGachaIncrement() {
    await sleepIf();
    return systems['system.kami.gacha.mint'].init();
  }

  // sets the prices for the merchant at the specified roomIndex
  async function setListing(
    merchantIndex: number,
    itemIndex: number,
    buyPrice: number,
    sellPrice: number
  ) {
    await sleepIf();
    return systems['system.listing.registry'].create(
      defaultAbiCoder.encode(
        ['uint32', 'uint32', 'uint256', 'uint256'],
        [merchantIndex, itemIndex, buyPrice, sellPrice]
      )
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
    return systems['system.node.registry'].create(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'uint32', 'string', 'string', 'string'],
        [index, type, roomIndex, name, description, affinity]
      )
    );
  }

  // @dev deletes node
  async function deleteNode(index: number) {
    await sleepIf();
    return systems['system.node.registry'].remove(index);
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
    await sleepIf();
    return systems['system.quest.registry'].executeTyped(
      index,
      name,
      description,
      endText,
      repeatTime
    );
  }

  // delete a quest along with its objectives, requirements and rewards
  async function deleteQuest(index: number) {
    await sleepIf();
    return systems['system.quest.registry'].remove(index);
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
    return systems['system.quest.registry'].addObjective(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'string', 'uint32', 'uint256'],
        [questIndex, name, logicType, type, index, value]
      )
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
    return systems['system.quest.registry'].addRequirement(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'uint32', 'uint256'],
        [questIndex, logicType, type, index, value]
      )
    );
  }

  // creates a Reward for an existing Quest
  async function addQuestReward(questIndex: number, type: string, index: number, value: number) {
    await sleepIf();
    return systems['system.quest.registry'].addReward(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'uint32', 'uint256'],
        [questIndex, type, index, value]
      )
    );
  }

  /////////////////
  //  ROOMS

  // @dev creates a room with name, roomIndex and exits. cannot overwrite room at roomIndex
  async function createRoom(
    x: number,
    y: number,
    z: number,
    roomIndex: number,
    name: string,
    description: string,
    exits: number[]
  ) {
    await sleepIf();
    return systems['system.room.registry'].create(
      defaultAbiCoder.encode(
        ['int32', 'int32', 'int32', 'uint32', 'string', 'string', 'uint32[]'],
        [x, y, z, roomIndex, name, description, exits.length == 0 ? [] : exits]
      )
    );
  }

  async function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: BigNumberish,
    type: string,
    logicType: string
  ) {
    await sleepIf();
    return systems['system.room.registry'].addGate(
      defaultAbiCoder.encode(
        ['uint32', 'uint32', 'uint32', 'uint32', 'string', 'string'],
        [roomIndex, sourceIndex, conditionIndex, conditionValue, type, logicType]
      )
    );
  }

  async function deleteRoom(roomIndex: number) {
    await sleepIf();
    return systems['system.room.registry'].remove(roomIndex);
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
    return systems['system.skill.registry'].create(
      defaultAbiCoder.encode(
        [
          'uint32',
          'string',
          'string',
          'string',
          'string',
          'string',
          'uint256',
          'uint256',
          'uint256',
          'string',
        ],
        [index, for_, type, tree, name, description, cost, max, treeTier, media]
      )
    );
  }

  async function deleteSkill(index: number) {
    return systems['system.skill.registry'].remove(index);
  }

  async function addSkillEffect(skillIndex: number, type: string, subtype: string, value: number) {
    await sleepIf();
    return systems['system.skill.registry'].addEffect(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'int256'],
        [skillIndex, type, subtype, value]
      )
    );
  }

  async function addSkillRequirement(
    skillIndex: number,
    type: string,
    logicType: string,
    index: number,
    value: number
  ) {
    await sleepIf();
    return systems['system.skill.registry'].addRequirement(
      defaultAbiCoder.encode(
        ['uint32', 'string', 'string', 'uint32', 'uint256'],
        [skillIndex, type, logicType, index, value]
      )
    );
  }

  /////////////////
  //  ITEMS

  // @dev deletes an item registry
  async function deleteItem(index: number) {
    await sleepIf();
    return systems['system.item.registry'].remove(index);
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
    return systems['system.trait.registry'].create(
      defaultAbiCoder.encode(
        [
          'uint32',
          'int32',
          'int32',
          'int32',
          'int32',
          'int32',
          'uint256',
          'string',
          'string',
          'string',
        ],
        [index, health, power, violence, harmony, slots, rarity, affinity, name, type]
      )
    );
  }

  // @dev deletes trait
  async function deleteTrait(index: number, type: string) {
    await sleepIf();
    return systems['system.trait.registry'].remove(index, type);
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
    return systems['system.relationship.registry'].create(
      defaultAbiCoder.encode(
        ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]'],
        [indexNPC, indexRelationship, name, whitelist, blacklist]
      )
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
    return systems['system.relationship.registry'].update(
      defaultAbiCoder.encode(
        ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]'],
        [indexNPC, indexRelationship, name, whitelist, blacklist]
      )
    );
  }

  async function deleteRelationship(indexNPC: number, indexRelationship: number) {
    await sleepIf();
    return systems['system.relationship.registry'].remove(indexNPC, indexRelationship);
  }

  //////////////////
  // WAITS

  function sleepIf() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || import.meta.env.MODE;
    if (mode && ['production', 'staging'].includes(mode)) {
      console.log('sleeping');
      return new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return {
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
    forceReveal: {
      pet: petForceReveal,
      droptable: droptableForceReveal,
      replaceDroptable: droptableReplaceReveal,
    },
    registry: {
      item: {
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
