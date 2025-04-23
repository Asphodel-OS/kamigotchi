import { BigNumberish } from 'ethers';

import { SystemBytecodes } from '../../contracts/mappings/SystemBytecodes';
import { createCall, toUint32FixedArrayLiteral } from '../../scripts/systemCaller';
import { auctionAPI } from './auctions';
import { goalsAPI } from './goals';
import { listingAPI } from './listings';
import { questsAPI } from './quests';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

// i have become what i hate most, woe is jiraheron
export type GenCall = (
  systemID: keyof typeof SystemBytecodes,
  args: any[],
  func?: string,
  encodedTypes?: any,
  gasLimit?: BigNumberish
) => void;

export function createAdminAPI(compiledCalls: string[]) {
  // @dev generates an entry in json for calling systems
  // @param systemID system ID
  // @param args arguments to pass to the system
  // @param func optional, function name to call instead of executeTyped
  // @param typed optional, if true, skip argument encoding
  function genCall(
    systemID: keyof typeof SystemBytecodes,
    args: any[],
    func?: string,
    encodedTypes?: any[],
    gasLimit?: BigNumberish
  ) {
    // if execute or has typed args, encode args
    const encode = func === undefined || encodedTypes !== undefined;
    const call = createCall(systemID, args, encode, encodedTypes);

    const callData = `{
"system": "${call.system}",
"id": "${call.id}",
"func": "${func ? func : 'execute'}",
"args": "${call.args}"
${gasLimit ? `, "gas": "${gasLimit}"` : ''}
}`;

    compiledCalls.push(callData);
  }

  /////////////////
  // AUTH

  async function addRole(addr: string, role: string) {
    genCall('system.auth.registry', [addr, role], 'addRole');
  }

  async function removeRole(addr: string, role: string) {
    genCall('system.auth.registry', [addr, role], 'removeRole');
  }

  /////////////////
  // ADMIN

  /////////////////
  //  CONFIG

  async function setConfig(field: string, value: BigNumberish) {
    genCall('system.config.registry', [field, value]);
  }

  async function setConfigAddress(field: string, value: string) {
    genCall('system.config.registry', [field, value], 'setValueAddress');
  }

  async function setConfigBool(field: string, value: boolean) {
    genCall('system.config.registry', [field, value], 'setValueBool');
  }

  async function setConfigArray(field: string, value: number[]) {
    const arr = new Array(8);
    arr.fill(0);
    for (let i = 0; i < value.length; i++) arr[i] = value[i];
    genCall('system.config.registry', [field, toUint32FixedArrayLiteral(arr)], 'setValueArray');
  }

  // values must be ≤ 32char
  async function setConfigString(field: string, value: string) {
    genCall('system.config.registry', [field, value], 'setValueString');
  }

  /////////////////
  // FACTIONS

  async function createFaction(index: number, name: string, description: string, image: string) {
    genCall('system.faction.registry', [index, name, description, image], 'create', [
      'uint32',
      'string',
      'string',
      'string',
    ]);
  }

  async function deleteFaction(index: number) {
    genCall('system.faction.registry', [index], 'remove');
  }

  /////////////////
  //  GOALS

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  async function createNPC(index: number, name: string, roomIndex: number) {
    genCall('system.npc.registry', [index, name, roomIndex], 'create', [
      'uint32',
      'string',
      'uint32',
    ]);
  }

  async function setNPCRoom(index: number, roomIndex: number) {
    genCall('system.npc.registry', [index, roomIndex], 'setRoom');
  }

  async function setNPCName(index: number, name: string) {
    genCall('system.npc.registry', [index, name], 'setName');
  }

  /////////////////
  // MINT

  async function initBatchMinter() {
    genCall('system.Kami721.BatchMint', [], 'setTraits');
  }

  async function batchMint(amount: number, gasLimit?: BigNumberish) {
    genCall('system.Kami721.BatchMint', [amount], 'batchMint', undefined, gasLimit);
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
    item: number,
    room: number,
    name: string,
    description: string,
    affinity: string
  ) {
    genCall(
      'system.node.registry',
      [index, type, item, room, name, description, affinity],
      'create',
      ['uint32', 'string', 'uint32', 'uint32', 'string', 'string', 'string']
    );
  }

  async function createNodeRequirement(
    index: number,
    type: string,
    logic: string,
    index_: number,
    value: number,
    for_: string
  ) {
    genCall('system.node.registry', [index, type, logic, index_, value, for_], 'addRequirement', [
      'uint32',
      'string',
      'string',
      'uint32',
      'uint256',
      'string',
    ]);
  }

  async function createNodeScav(index: number, tierCost: number) {
    genCall('system.node.registry', [index, tierCost], 'addScavBar');
  }

  async function addNodeScavRewardBasic(
    nodeIndex: number,
    type: string,
    index: number,
    value: number
  ) {
    genCall('system.node.registry', [nodeIndex, type, index, value], 'addScavRewardBasic', [
      'uint32',
      'string',
      'uint32',
      'uint256',
    ]);
  }

  async function addNodeScavRewardDT(
    nodeIndex: number,
    keys: number[],
    weights: number[],
    value: number
  ) {
    genCall('system.node.registry', [nodeIndex, keys, weights, value], 'addScavRewardDT', [
      'uint32',
      'uint32[]',
      'uint256[]',
      'uint256',
    ]);
  }

  // @dev deletes node
  async function deleteNode(index: number) {
    genCall('system.node.registry', [index], 'remove');
  }

  /////////////////
  //  RECIPES

  async function createRecipe(
    index: number,
    inputs: number[],
    inputAmounts: number[],
    outputs: number[],
    outputAmounts: number[],
    xp: number,
    stamina: number
  ) {
    genCall(
      'system.recipe.registry',
      [index, inputs, inputAmounts, outputs, outputAmounts, xp, stamina],
      'create',
      ['uint32', 'uint32[]', 'uint256[]', 'uint32[]', 'uint256[]', 'uint256', 'uint256']
    );
  }

  async function addRecipeAssigner(index: number, assigner: string) {
    genCall('system.recipe.registry', [index, assigner], 'addAssigner');
  }

  async function addRecipeRequirement(
    index: number,
    type: string,
    logic: string,
    index_: number,
    value: number,
    for_: string
  ) {
    genCall('system.recipe.registry', [index, type, logic, index_, value, for_], 'addRequirement');
  }

  async function deleteRecipe(index: number) {
    genCall('system.recipe.registry', [index], 'remove');
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
    genCall(
      'system.room.registry',
      [x, y, z, roomIndex, name, description, exits.length == 0 ? [] : exits],
      'create',
      ['int32', 'int32', 'int32', 'uint32', 'string', 'string', 'uint32[]']
    );
  }

  async function createRoomGate(
    roomIndex: number,
    sourceIndex: number,
    conditionIndex: number,
    conditionValue: BigNumberish,
    type: string,
    logicType: string,
    for_: string
  ) {
    genCall(
      'system.room.registry',
      [roomIndex, sourceIndex, conditionIndex, conditionValue, type, logicType, for_],
      'addGate',
      ['uint32', 'uint32', 'uint32', 'uint256', 'string', 'string', 'string']
    );
  }

  async function deleteRoom(roomIndex: number) {
    genCall('system.room.registry', [roomIndex], 'remove');
  }

  /////////////////
  // SKILLS

  async function createSkill(
    index: number,
    for_: string,
    tree: string,
    name: string,
    description: string,
    cost: number,
    max: number,
    treeTier: number,
    media: string
  ) {
    genCall(
      'system.skill.registry',
      [index, for_, tree, name, description, cost, max, treeTier, media],
      'create',
      ['uint32', 'string', 'string', 'string', 'string', 'uint256', 'uint256', 'uint256', 'string']
    );
  }

  async function deleteSkill(index: number) {
    genCall('system.skill.registry', [index], 'remove');
  }

  async function addSkillBonus(skillIndex: number, type: string, value: number) {
    genCall('system.skill.registry', [skillIndex, type, value], 'addBonus', [
      'uint32',
      'string',
      'int256',
    ]);
  }

  async function addSkillRequirement(
    skillIndex: number,
    type: string,
    logicType: string,
    index: number,
    value: number,
    for_: string
  ) {
    genCall(
      'system.skill.registry',
      [skillIndex, type, logicType, index, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  /////////////////
  //  ITEMS

  async function registerBaseItem(
    index: number,
    for_: string,
    name: string,
    description: string,
    media: string
  ) {
    genCall('system.item.registry', [index, for_, name, description, media], 'create', [
      'uint32',
      'string',
      'string',
      'string',
      'string',
    ]);
  }

  // @dev add a misc item in registry entry
  async function registerConsumable(
    index: number,
    for_: string,
    name: string,
    description: string,
    type_: string,
    media: string
  ) {
    genCall(
      'system.item.registry',
      [index, for_, name, description, type_, media],
      'createConsumable',
      ['uint32', 'string', 'string', 'string', 'string', 'string']
    );
  }

  //// ITEM FLAGS

  async function addItemFlag(index: number, flag: string) {
    genCall('system.item.registry', [index, flag], 'addFlag');
  }

  async function addItemERC20(index: number, address: string) {
    genCall('system.item.registry', [index, address], 'addERC20');
  }

  //// ITEM REQUIREMENTS

  async function addItemRequirement(
    index: number,
    usecase: string,
    type_: string,
    logicType: string,
    index_: number,
    value: number,
    for_: string
  ) {
    genCall(
      'system.item.registry',
      [index, usecase, type_, logicType, index_, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'string', 'uint32', 'uint256', 'string']
    );
  }

  //// ITEM ALLOS

  async function addItemBasic(
    index: number,
    usecase: string,
    type: string,
    index_: number,
    value: number
  ) {
    genCall('system.item.registry', [index, usecase, type, index_, value], 'addAlloBasic', [
      'uint32',
      'string',
      'string',
      'uint32',
      'uint256',
    ]);
  }

  async function addItemBonus(
    index: number,
    usecase: string,
    bonusType: string,
    endType: string,
    duration: number,
    value: number
  ) {
    genCall(
      'system.item.registry',
      [index, usecase, bonusType, endType, duration, value],
      'addAlloBonus',
      ['uint32', 'string', 'string', 'string', 'uint256', 'int256']
    );
  }

  async function addItemDT(
    index: number,
    usecase: string,
    keys: number[],
    weights: number[],
    value: number
  ) {
    genCall('system.item.registry', [index, usecase, keys, weights, value], 'addAlloDT', [
      'uint32',
      'string',
      'uint32[]',
      'uint256[]',
      'uint256',
    ]);
  }

  async function addItemStat(
    index: number,
    usecase: string,
    statType: string,
    base: number,
    shift: number,
    boost: number,
    sync: number
  ) {
    genCall(
      'system.item.registry',
      [index, usecase, statType, base, shift, boost, sync],
      'addAlloStat',
      ['uint32', 'string', 'string', 'int32', 'int32', 'int32', 'int32']
    );
  }

  // @dev deletes an item registry
  async function deleteItem(index: number) {
    genCall('system.item.registry', [index], 'remove');
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
    genCall(
      'system.trait.registry',
      [index, health, power, violence, harmony, slots, rarity, affinity, name, type],
      'create',
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
      ]
    );
  }

  // @dev deletes trait
  async function deleteTrait(index: number, type: string) {
    genCall('system.trait.registry', [index, type], 'remove');
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
    genCall(
      'system.relationship.registry',
      [indexNPC, indexRelationship, name, whitelist, blacklist],
      'create',
      ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]']
    );
  }

  async function updateRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    genCall(
      'system.relationship.registry',
      [indexNPC, indexRelationship, name, whitelist, blacklist],
      'update',
      ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]']
    );
  }

  async function deleteRelationship(indexNPC: number, indexRelationship: number) {
    genCall('system.relationship.registry', [indexNPC, indexRelationship], 'remove');
  }

  function attachItemERC20(index: number) {
    genCall('system.local.setup', [index], 'attachItemERC20');
  }

  ////////////////
  // SETUP

  function distributePassports(owners: string[], amts: number[]) {
    genCall('system.setup.snapshot.t2', [owners, amts], 'distributePassports', [
      'address[]',
      'uint256[]',
    ]);
  }

  function distributeGachaWhitelists(owners: string[]) {
    genCall('system.setup.snapshot.t2', [owners], 'whitelistAccounts', ['address[]']);
  }

  ////////////////
  // SETUP (testing)

  function worldWhitelistAccount(accounts: string) {
    genCall('system.world.whitelist.set', [accounts], 'whitelist', undefined, 400000);
  }

  ////////////////
  // SETUP (puter)

  function initAccounts() {
    genCall('system.local.setup', [], 'initAccounts');
  }

  function initPets() {
    genCall('system.local.setup', [], 'initPets');
  }

  function initHarvests() {
    genCall('system.local.setup', [], 'initHarvests');
  }

  return {
    gen: genCall,
    auth: {
      roles: {
        add: addRole,
        remove: removeRole,
      },
    },
    auction: auctionAPI(genCall),
    config: {
      set: {
        address: setConfigAddress,
        array: setConfigArray,
        bool: setConfigBool,
        number: setConfig,
        string: setConfigString,
      },
    },
    faction: {
      create: createFaction,
      delete: deleteFaction,
    },
    goal: goalsAPI(genCall),
    listing: listingAPI(genCall),
    node: {
      create: createNode,
      add: {
        requirement: createNodeRequirement,
        scav: createNodeScav,
        scavReward: {
          basic: addNodeScavRewardBasic,
          droptable: addNodeScavRewardDT,
        },
      },
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
    },
    registry: {
      item: {
        create: {
          base: registerBaseItem,
          consumable: registerConsumable,
        },
        add: {
          erc20: addItemERC20,
          flag: addItemFlag,
          requirement: addItemRequirement,
          allo: {
            basic: addItemBasic,
            bonus: addItemBonus,
            droptable: addItemDT,
            stat: addItemStat,
          },
        },
        delete: deleteItem,
      },
      trait: {
        create: registerTrait,
        delete: deleteTrait,
      },
      quest: questsAPI(genCall),
      recipe: {
        create: createRecipe,
        add: {
          assigner: addRecipeAssigner,
          requirement: addRecipeRequirement,
        },
        delete: deleteRecipe,
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
          bonus: addSkillBonus,
          requirement: addSkillRequirement,
        },
      },
    },
    room: {
      create: createRoom,
      createGate: createRoomGate,
      delete: deleteRoom,
    },
    setup: {
      local: {
        initAccounts: initAccounts,
        initPets: initPets,
        initHarvests: initHarvests,
        attachItemERC20: attachItemERC20,
      },
      testing: {
        account: {
          wl: worldWhitelistAccount,
        },
      },
      live: {
        passports: distributePassports,
        whitelists: distributeGachaWhitelists,
      },
    },
  };
}
