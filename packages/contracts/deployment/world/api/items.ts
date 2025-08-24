import { BigNumberish } from 'ethers';
import { GenerateCallData } from './types';

export function itemsAPI(generateCallData: GenerateCallData, compiledCalls: string[]) {
  // @dev add a misc item to the registry
  async function registerBase(
    index: number,
    for_: string,
    name: string,
    description: string,
    media: string,
    rarity: number
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, for_, name, description, media, rarity],
      'create',
      ['uint32', 'string', 'string', 'string', 'string', 'uint32']
    );
    compiledCalls.push(callData);
  }

  // @dev add a consumable item to the registry with a 'for_' target
  async function registerConsumable(
    index: number,
    for_: string,
    name: string,
    description: string,
    type_: string,
    media: string,
    rarity: number
  ) {
    const callData = generateCallData(
      'system.item.registry',
      [index, for_, name, description, type_, media, rarity],
      'createConsumable',
      ['uint32', 'string', 'string', 'string', 'string', 'string', 'uint32']
    );
    compiledCalls.push(callData);
  }

  /////////////////
  // ITEM FLAGS

  // add a flag to an item
  async function addFlag(index: number, flag: string) {
    const callData = generateCallData('system.item.registry', [index, flag], 'addFlag');
    compiledCalls.push(callData);
  }

  // add an ERC20 reference to an item
  async function addERC20(index: number, address: string) {
    const callData = generateCallData('system.item.registry', [index, address], 'addERC20');
    compiledCalls.push(callData);
  }

  /////////////////
  // REQUIREMENTS

  // add a requirement for an item
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

  /////////////////
  // ALLOS

  // add a baisic item allo to an item
  async function addAllo(
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

  async function addAlloBonus(
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

  async function addAlloDT(
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

  async function addAlloStat(
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
  async function remove(index: number) {
    const callData = generateCallData('system.item.registry', [index], 'remove');
    compiledCalls.push(callData);
  }

  return {
    create: {
      base: registerBase,
      consumable: registerConsumable,
    },
    add: {
      erc20: addERC20,
      flag: addFlag,
      requirement: addItemRequirement,
      allo: {
        basic: addAllo,
        bonus: addAlloBonus,
        droptable: addAlloDT,
        stat: addAlloStat,
      },
    },
    delete: remove,
  };
}
