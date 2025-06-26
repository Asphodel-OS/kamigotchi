import { BigNumberish } from 'ethers';

import { toUint32FixedArrayLiteral } from '../../scripts/systemCaller';
import { auctionAPI } from './auctions';
import { goalsAPI } from './goals';
import { listingAPI } from './listings';
import { nodesAPI } from './nodes';
import { questsAPI } from './quests';
import { generateCallData } from './utils';

export type AdminAPI = Awaited<ReturnType<typeof createAdminAPI>>;

export function createAdminAPI(compiledCalls: string[]) {
  /////////////////
  // AUTH

  async function addRole(addr: string, role: string) {
    const callData = generateCallData('system.auth.registry', [addr, role], 'addRole');
    compiledCalls.push(callData);
  }

  async function removeRole(addr: string, role: string) {
    const callData = generateCallData('system.auth.registry', [addr, role], 'removeRole');
    compiledCalls.push(callData);
  }

  /////////////////
  //  CONFIG

  async function setConfig(field: string, value: BigNumberish) {
    const callData = generateCallData(
      'system.config.registry',
      [field, value],
      undefined,
      undefined,
      '800000'
    );
    compiledCalls.push(callData);
  }

  async function setConfigAddress(field: string, value: string) {
    const callData = generateCallData('system.config.registry', [field, value], 'setValueAddress');
    compiledCalls.push(callData);
  }

  async function setConfigBool(field: string, value: boolean) {
    const callData = generateCallData('system.config.registry', [field, value], 'setValueBool');
    compiledCalls.push(callData);
  }

  async function setConfigArray(field: string, value: number[]) {
    const arr = new Array(8);
    arr.fill(0);
    for (let i = 0; i < value.length; i++) arr[i] = value[i];
    const callData = generateCallData(
      'system.config.registry',
      [field, toUint32FixedArrayLiteral(arr)],
      'setValueArray'
    );
    compiledCalls.push(callData);
  }

  // values must be ≤ 32char
  async function setConfigString(field: string, value: string) {
    const callData = generateCallData('system.config.registry', [field, value], 'setValueString');
    compiledCalls.push(callData);
  }

  /////////////////
  // FACTIONS

  async function createFaction(index: number, name: string, description: string, image: string) {
    const callData = generateCallData(
      'system.faction.registry',
      [index, name, description, image],
      'create',
      ['uint32', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
  }

  async function deleteFaction(index: number) {
    const callData = generateCallData('system.faction.registry', [index], 'remove');
    compiledCalls.push(callData);
  }

  /////////////////
  //  GOALS

  /////////////////
  //  NPCs

  // (creates an NPC with the name at the specified roomIndex
  async function createNPC(index: number, name: string, roomIndex: number) {
    const callData = generateCallData('system.npc.registry', [index, name, roomIndex], 'create', [
      'uint32',
      'string',
      'uint32',
    ]);
    compiledCalls.push(callData);
  }

  async function setNPCRoom(index: number, roomIndex: number) {
    const callData = generateCallData('system.npc.registry', [index, roomIndex], 'setRoom');
    compiledCalls.push(callData);
  }

  async function setNPCName(index: number, name: string) {
    const callData = generateCallData('system.npc.registry', [index, name], 'setName');
    compiledCalls.push(callData);
  }

  /////////////////
  // MINT

  async function initBatchMinter() {
    const callData = generateCallData('system.Kami721.BatchMint', [], 'setTraits');
    compiledCalls.push(callData);
  }

  async function batchMint(amount: number, gasLimit?: BigNumberish) {
    const callData = generateCallData(
      'system.Kami721.BatchMint',
      [amount],
      'batchMint',
      undefined,
      gasLimit
    );
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.recipe.registry',
      [index, inputs, inputAmounts, outputs, outputAmounts, xp, stamina],
      'create',
      ['uint32', 'uint32[]', 'uint256[]', 'uint32[]', 'uint256[]', 'uint256', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function addRecipeAssigner(index: number, assigner: string) {
    const callData = generateCallData('system.recipe.registry', [index, assigner], 'addAssigner');
    compiledCalls.push(callData);
  }

  async function addRecipeRequirement(
    index: number,
    type: string,
    logic: string,
    index_: number,
    value: number,
    for_: string
  ) {
    const callData = generateCallData(
      'system.recipe.registry',
      [index, type, logic, index_, value, for_],
      'addRequirement'
    );
    compiledCalls.push(callData);
  }

  async function deleteRecipe(index: number) {
    const callData = generateCallData('system.recipe.registry', [index], 'remove');
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.room.registry',
      [x, y, z, roomIndex, name, description, exits.length == 0 ? [] : exits],
      'create',
      ['int32', 'int32', 'int32', 'uint32', 'string', 'string', 'uint32[]']
    );
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.room.registry',
      [roomIndex, sourceIndex, conditionIndex, conditionValue, type, logicType, for_],
      'addGate',
      ['uint32', 'uint32', 'uint32', 'uint256', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
  }

  async function deleteRoom(roomIndex: number) {
    const callData = generateCallData('system.room.registry', [roomIndex], 'remove');
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.skill.registry',
      [index, for_, tree, name, description, cost, max, treeTier, media],
      'create',
      ['uint32', 'string', 'string', 'string', 'string', 'uint256', 'uint256', 'uint256', 'string']
    );
    compiledCalls.push(callData);
  }

  async function deleteSkill(index: number) {
    const callData = generateCallData('system.skill.registry', [index], 'remove');
    compiledCalls.push(callData);
  }

  async function addSkillBonus(skillIndex: number, type: string, value: number) {
    const callData = generateCallData(
      'system.skill.registry',
      [skillIndex, type, value],
      'addBonus',
      ['uint32', 'string', 'int256']
    );
    compiledCalls.push(callData);
  }

  async function addSkillRequirement(
    skillIndex: number,
    type: string,
    logicType: string,
    index: number,
    value: number,
    for_: string
  ) {
    const callData = generateCallData(
      'system.skill.registry',
      [skillIndex, type, logicType, index, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'uint32', 'uint256', 'string']
    );
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.item.registry',
      [index, for_, name, description, media],
      'create',
      ['uint32', 'string', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.item.registry',
      [index, for_, name, description, type_, media],
      'createConsumable',
      ['uint32', 'string', 'string', 'string', 'string', 'string']
    );
    compiledCalls.push(callData);
  }

  //// ITEM FLAGS

  async function addItemFlag(index: number, flag: string) {
    const callData = generateCallData('system.item.registry', [index, flag], 'addFlag');
    compiledCalls.push(callData);
  }

  async function addItemERC20(index: number, address: string) {
    const callData = generateCallData('system.item.registry', [index, address], 'addERC20');
    compiledCalls.push(callData);
  }

  //// ITEM REQUIREMENTS

  async function addItemRequirement(
    index: number,
    usecase: string,
    type_: string,
    logicType: string,
    index_: number,
    value: BigNumberish,
    for_: string
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, usecase, type_, logicType, index_, value, for_],
      'addRequirement',
      ['uint32', 'string', 'string', 'string', 'uint32', 'uint256', 'string']
    );
    compiledCalls.push(callData);
  }

  //// ITEM ALLOS

  async function addItemBasic(
    index: number,
    usecase: string,
    type: string,
    index_: number,
    value: number
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, usecase, type, index_, value],
      'addAlloBasic',
      ['uint32', 'string', 'string', 'uint32', 'uint256']
    );
    compiledCalls.push(callData);
  }

  async function addItemBonus(
    index: number,
    usecase: string,
    bonusType: string,
    endType: string,
    duration: number,
    value: number
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, usecase, bonusType, endType, duration, value],
      'addAlloBonus',
      ['uint32', 'string', 'string', 'string', 'uint256', 'int256']
    );
    compiledCalls.push(callData);
  }

  async function addItemDT(
    index: number,
    usecase: string,
    keys: number[],
    weights: number[],
    value: number
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, usecase, keys, weights, value],
      'addAlloDT',
      ['uint32', 'string', 'uint32[]', 'uint256[]', 'uint256']
    );
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.item.registry',
      [index, usecase, statType, base, shift, boost, sync],
      'addAlloStat',
      ['uint32', 'string', 'string', 'int32', 'int32', 'int32', 'int32']
    );
    compiledCalls.push(callData);
  }

  // @dev deletes an item registry
  async function deleteItem(index: number) {
    const callData = generateCallData('system.item.registry', [index], 'remove');
    compiledCalls.push(callData);
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
    const callData = generateCallData(
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
    compiledCalls.push(callData);
  }

  // @dev deletes trait
  async function deleteTrait(index: number, type: string) {
    const callData = generateCallData('system.trait.registry', [index, type], 'remove');
    compiledCalls.push(callData);
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
    const callData = generateCallData(
      'system.relationship.registry',
      [indexNPC, indexRelationship, name, whitelist, blacklist],
      'create',
      ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]']
    );
    compiledCalls.push(callData);
  }

  async function updateRelationship(
    indexNPC: number,
    indexRelationship: number,
    name: string,
    whitelist: number[],
    blacklist: number[]
  ) {
    const callData = generateCallData(
      'system.relationship.registry',
      [indexNPC, indexRelationship, name, whitelist, blacklist],
      'update',
      ['uint32', 'uint32', 'string', 'uint32[]', 'uint32[]']
    );
    compiledCalls.push(callData);
  }

  async function deleteRelationship(indexNPC: number, indexRelationship: number) {
    const callData = generateCallData(
      'system.relationship.registry',
      [indexNPC, indexRelationship],
      'remove'
    );
    compiledCalls.push(callData);
  }

  function attachItemERC20(index: number) {
    const callData = generateCallData('system.local.setup', [index], 'attachItemERC20');
    compiledCalls.push(callData);
  }

  ////////////////
  // SETUP

  function distributePassports(owners: string[], amts: number[]) {
    const callData = generateCallData(
      'system.setup.snapshot.t2',
      [owners, amts],
      'distributePassports',
      ['address[]', 'uint256[]'],
      '60000000'
    );
    compiledCalls.push(callData);
  }

  function distributeGachaWhitelists(owners: string[]) {
    const callData = generateCallData(
      'system.setup.snapshot.t2',
      [owners],
      'whitelistAccounts',
      ['address[]'],
      '60000000'
    );
    compiledCalls.push(callData);
  }

  ////////////////
  // SETUP (testing)

  function worldWhitelistAccount(accounts: string) {
    const callData = generateCallData(
      'system.world.whitelist.set',
      [accounts],
      'whitelist',
      undefined,
      400000
    );
    compiledCalls.push(callData);
  }

  ////////////////
  // SETUP (puter)

  function initAccounts() {
    const callData = generateCallData('system.local.setup', [], 'initAccounts');
    compiledCalls.push(callData);
  }

  function initPets() {
    const callData = generateCallData('system.local.setup', [], 'initPets');
    compiledCalls.push(callData);
  }

  function initHarvests() {
    const callData = generateCallData('system.local.setup', [], 'initHarvests');
    compiledCalls.push(callData);
  }

  return {
    gen: generateCallData,
    auth: {
      roles: {
        add: addRole,
        remove: removeRole,
      },
    },
    auction: auctionAPI(generateCallData, compiledCalls),
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
    goal: goalsAPI(generateCallData, compiledCalls),
    listing: listingAPI(generateCallData, compiledCalls),
    node: nodesAPI(generateCallData, compiledCalls),
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
      quest: questsAPI(generateCallData, compiledCalls),
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
